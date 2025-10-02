import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    // Get file from form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const haVersion = formData.get('ha_version') as string;

    if (!file) {
      console.error('No file provided');
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check file size against subscription limits
    const maxSizeBytes = subscription.max_storage_gb * 1024 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      console.error('File too large:', file.size, '>', maxSizeBytes);
      return new Response(
        JSON.stringify({ 
          error: 'File too large', 
          max_size_gb: subscription.max_storage_gb 
        }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create backup record
    const filename = file.name || `backup-${Date.now()}.tar`;
    const storagePath = `${userId}/${Date.now()}-${filename}`;

    const { data: backup, error: backupError } = await supabase
      .from('backups')
      .insert({
        user_id: userId,
        filename,
        storage_path: storagePath,
        size_bytes: file.size,
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

    // Upload to storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('backups')
      .upload(storagePath, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload failed:', uploadError);
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

      return new Response(
        JSON.stringify({ error: 'Upload failed', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update backup status to completed
    const { data: completedBackup } = await supabase
      .from('backups')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', backup.id)
      .select()
      .single();

    // Log success
    await supabase.from('backup_logs').insert({
      user_id: userId,
      backup_id: backup.id,
      action: 'upload',
      status: 'success',
      message: `Backup uploaded successfully: ${filename}`,
      metadata: {
        size_bytes: file.size,
        ha_version: haVersion
      }
    });

    console.log('Backup uploaded successfully:', backup.id);

    return new Response(
      JSON.stringify({
        success: true,
        backup: completedBackup
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});