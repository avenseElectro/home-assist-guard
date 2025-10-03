import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  console.log('[backup-upload] Request received:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[backup-upload] Creating Supabase client...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('[backup-upload] Supabase client created');

    // Get API key from header
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      console.error('Missing API key');
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key and get user
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id, revoked_at')
      .eq('key_hash', apiKey)
      .single();

    if (keyError || !keyData || keyData.revoked_at) {
      console.error('Invalid API key:', keyError);
      return new Response(
        JSON.stringify({ error: 'Invalid or revoked API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = keyData.user_id;

    // Update last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', apiKey);

    // Check subscription limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!subscription) {
      console.error('No subscription found for user:', userId);
      return new Response(
        JSON.stringify({ error: 'Subscription not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check backup count
    const { count: backupCount } = await supabase
      .from('backups')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'deleted');

    if (backupCount && backupCount >= subscription.max_backups) {
      console.error('Backup limit reached:', backupCount, '/', subscription.max_backups);
      return new Response(
        JSON.stringify({ 
          error: 'Backup limit reached', 
          limit: subscription.max_backups,
          current: backupCount 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get file from request body (streaming)
    console.log('[backup-upload] Reading request headers...');
    const haVersion = req.headers.get('x-ha-version') || 'unknown';
    const contentLength = req.headers.get('content-length');
    console.log('[backup-upload] HA Version:', haVersion, 'Content-Length:', contentLength);
    
    if (!req.body) {
      console.error('[backup-upload] No file body provided');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileSize = contentLength ? parseInt(contentLength) : 0;
    console.log('[backup-upload] File size:', fileSize, 'bytes');

    // Check individual backup size against subscription limit
    const maxBackupSizeBytes = subscription.max_backup_size_gb * 1024 * 1024 * 1024;
    if (fileSize > maxBackupSizeBytes) {
      console.error('Backup too large:', fileSize, '>', maxBackupSizeBytes);
      return new Response(
        JSON.stringify({ 
          error: 'Backup exceeds maximum size for your plan', 
          max_backup_size_gb: subscription.max_backup_size_gb,
          file_size_gb: (fileSize / (1024 * 1024 * 1024)).toFixed(2)
        }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check total storage usage
    const { data: existingBackups } = await supabase
      .from('backups')
      .select('size_bytes')
      .eq('user_id', userId)
      .neq('status', 'deleted');

    const totalUsedBytes = (existingBackups || []).reduce((sum, b) => sum + (b.size_bytes || 0), 0);
    const totalAfterUpload = totalUsedBytes + fileSize;
    const maxTotalBytes = subscription.max_storage_gb * 1024 * 1024 * 1024;

    if (totalAfterUpload > maxTotalBytes) {
      console.error('Total storage limit exceeded:', totalAfterUpload, '>', maxTotalBytes);
      return new Response(
        JSON.stringify({ 
          error: 'Total storage limit exceeded', 
          max_storage_gb: subscription.max_storage_gb,
          current_usage_gb: (totalUsedBytes / (1024 * 1024 * 1024)).toFixed(2),
          file_size_gb: (fileSize / (1024 * 1024 * 1024)).toFixed(2)
        }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create backup record
    const filename = `backup-${Date.now()}.tar`;
    const storagePath = `${userId}/${Date.now()}-${filename}`;

    const { data: backup, error: backupError } = await supabase
      .from('backups')
      .insert({
        user_id: userId,
        filename,
        storage_path: storagePath,
        size_bytes: fileSize,
        ha_version: haVersion,
        status: 'uploading'
      })
      .select()
      .single();

    if (backupError) {
      console.error('Failed to create backup record:', backupError);
      return new Response(
        JSON.stringify({ error: 'Failed to create backup record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upload to storage in background (streaming)
    console.log('[backup-upload] Starting background storage upload:', storagePath);
    console.log('[backup-upload] Body type:', typeof req.body, 'Is ReadableStream:', req.body instanceof ReadableStream);
    
    // Clone the body stream so it can be used in the background task
    // The original body is closed when we return the response
    const [bodyForUpload, _bodyDiscard] = req.body!.tee();
    
    // Start background upload task
    const uploadTask = (async () => {
      try {
        console.log('[backup-upload] Background task: Starting upload...');
        const { error: uploadError } = await supabase.storage
          .from('backups')
          .upload(storagePath, bodyForUpload, {
            contentType: 'application/x-tar',
            upsert: false
          });
        
        console.log('[backup-upload] Background task: Upload completed, error:', uploadError);

        if (uploadError) {
          console.error('[backup-upload] Background task: Upload failed:', uploadError);
          // Update backup status to failed
          await supabase
            .from('backups')
            .update({ 
              status: 'failed', 
              error_message: uploadError.message 
            })
            .eq('id', backup.id);

          // Log error
          await supabase.from('backup_logs').insert({
            user_id: userId,
            backup_id: backup.id,
            action: 'upload',
            status: 'failed',
            message: uploadError.message
          });
          return;
        }

        // Update backup status to completed
        await supabase
          .from('backups')
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString() 
          })
          .eq('id', backup.id);

        // Log success
        await supabase.from('backup_logs').insert({
          user_id: userId,
          backup_id: backup.id,
          action: 'upload',
          status: 'success',
          message: `Backup uploaded successfully: ${filename}`,
          metadata: {
            size_bytes: fileSize,
            ha_version: haVersion
          }
        });

        console.log('[backup-upload] Background task: Backup uploaded successfully:', backup.id);
      } catch (error) {
        console.error('[backup-upload] Background task error:', error);
        await supabase
          .from('backups')
          .update({ 
            status: 'failed', 
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', backup.id);
      }
    })();

    // Use waitUntil to keep the function alive for the background task
    // @ts-ignore - EdgeRuntime is available in Deno Deploy
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(uploadTask);
    }

    // Return immediate response - upload continues in background
    console.log('[backup-upload] Returning immediate response, upload continues in background');
    return new Response(
      JSON.stringify({
        success: true,
        backup_id: backup.id,
        message: 'Upload started in background',
        status: 'uploading'
      }),
      { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[backup-upload] Unexpected error:', error);
    console.error('[backup-upload] Error stack:', error instanceof Error ? error.stack : 'N/A');
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});