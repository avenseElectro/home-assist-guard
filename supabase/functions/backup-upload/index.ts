import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// Hash API key using SHA-256
async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

serve(async (req) => {
  console.log('[backup-upload] Request received:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'init';
    
    console.log('[backup-upload] Action:', action);
    console.log('[backup-upload] Creating Supabase client...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get API key from header
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash the incoming API key to compare with stored hash
    const hashedKey = await hashApiKey(apiKey);

    // Validate API key and get user
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id, revoked_at')
      .eq('key_hash', hashedKey)
      .single();

    if (keyError || !keyData || keyData.revoked_at) {
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
      .eq('key_hash', hashedKey);

    if (action === 'init') {
      // Initialize upload - validate limits and return presigned URL
      return await handleInit(supabase, userId, req);
    } else if (action === 'chunk') {
      // Receive and store a chunk
      return await handleChunk(supabase, userId, req);
    } else if (action === 'complete') {
      // Mark upload as complete
      return await handleComplete(supabase, userId, req);
    } else if (action === 'fail') {
      // Mark upload as failed
      return await handleFail(supabase, userId, req);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[backup-upload] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleInit(supabase: any, userId: string, req: Request) {
  console.log('[backup-upload] Handling init...');
  
  const body = await req.json();
  const { file_size, ha_version, backup_trigger } = body;
  
  if (!file_size) {
    return new Response(
      JSON.stringify({ error: 'Missing file_size' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check subscription limits
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!subscription) {
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
    return new Response(
      JSON.stringify({ 
        error: 'Backup limit reached', 
        limit: subscription.max_backups,
        current: backupCount 
      }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check individual backup size
  const maxBackupSizeBytes = subscription.max_backup_size_gb * 1024 * 1024 * 1024;
  if (file_size > maxBackupSizeBytes) {
    return new Response(
      JSON.stringify({ 
        error: 'Backup exceeds maximum size for your plan', 
        max_backup_size_gb: subscription.max_backup_size_gb,
        file_size_gb: (file_size / (1024 * 1024 * 1024)).toFixed(2)
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

  const totalUsedBytes = (existingBackups || []).reduce((sum: number, b: any) => sum + (b.size_bytes || 0), 0);
  const totalAfterUpload = totalUsedBytes + file_size;
  const maxTotalBytes = subscription.max_storage_gb * 1024 * 1024 * 1024;

  if (totalAfterUpload > maxTotalBytes) {
    return new Response(
      JSON.stringify({ 
        error: 'Total storage limit exceeded', 
        max_storage_gb: subscription.max_storage_gb,
        current_usage_gb: (totalUsedBytes / (1024 * 1024 * 1024)).toFixed(2),
        file_size_gb: (file_size / (1024 * 1024 * 1024)).toFixed(2)
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
      size_bytes: file_size,
      ha_version: ha_version || 'unknown',
      backup_trigger: backup_trigger || 'manual',
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

  console.log('[backup-upload] Init successful, ready for chunks');
  return new Response(
    JSON.stringify({
      success: true,
      backup_id: backup.id,
      storage_path: storagePath
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleChunk(supabase: any, userId: string, req: Request) {
  console.log('[backup-upload] Handling chunk upload...');
  
  const url = new URL(req.url);
  const backupId = url.searchParams.get('backup_id');
  const chunkNumber = url.searchParams.get('chunk_number');
  const offset = url.searchParams.get('offset');

  if (!backupId || !chunkNumber || !offset) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify backup exists and belongs to user
  const { data: backup, error: backupError } = await supabase
    .from('backups')
    .select('*')
    .eq('id', backupId)
    .eq('user_id', userId)
    .single();

  if (backupError || !backup) {
    console.error('Backup not found:', backupError);
    return new Response(
      JSON.stringify({ error: 'Backup not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Read chunk data
  const chunkData = await req.arrayBuffer();
  const chunkBytes = new Uint8Array(chunkData);
  
  console.log(`[backup-upload] Received chunk ${chunkNumber} of ${chunkBytes.length} bytes at offset ${offset}`);

  // Upload chunk to storage using upsert to append to existing file
  const { error: uploadError } = await supabase.storage
    .from('backups')
    .upload(backup.storage_path, chunkBytes, {
      contentType: 'application/x-tar',
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    console.error('[backup-upload] Failed to upload chunk:', uploadError);
    return new Response(
      JSON.stringify({ error: 'Failed to upload chunk', details: uploadError.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`[backup-upload] Chunk ${chunkNumber} uploaded successfully`);
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleComplete(supabase: any, userId: string, req: Request) {
  console.log('[backup-upload] Handling complete...');
  
  const body = await req.json();
  const { backup_id } = body;

  if (!backup_id) {
    return new Response(
      JSON.stringify({ error: 'Missing backup_id' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify backup belongs to user
  const { data: backup, error: backupError } = await supabase
    .from('backups')
    .select('*')
    .eq('id', backup_id)
    .eq('user_id', userId)
    .single();

  if (backupError || !backup) {
    return new Response(
      JSON.stringify({ error: 'Backup not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Update backup status to completed
  await supabase
    .from('backups')
    .update({ 
      status: 'completed', 
      completed_at: new Date().toISOString() 
    })
    .eq('id', backup_id);

  // Log success using secure function
  await supabase.rpc('insert_backup_log', {
    _user_id: userId,
    _action: 'upload',
    _status: 'success',
    _message: `Backup uploaded successfully: ${backup.filename}`,
    _backup_id: backup_id,
    _metadata: {
      size_bytes: backup.size_bytes,
      ha_version: backup.ha_version
    }
  });

  console.log('[backup-upload] Upload completed successfully');
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Upload completed'
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleFail(supabase: any, userId: string, req: Request) {
  console.log('[backup-upload] Handling fail...');
  
  const body = await req.json();
  const { backup_id, error_message } = body;

  if (!backup_id) {
    return new Response(
      JSON.stringify({ error: 'Missing backup_id' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Update backup status to failed
  await supabase
    .from('backups')
    .update({ 
      status: 'failed', 
      error_message: error_message || 'Upload failed'
    })
    .eq('id', backup_id)
    .eq('user_id', userId);

  // Log failure using secure function
  await supabase.rpc('insert_backup_log', {
    _user_id: userId,
    _action: 'upload',
    _status: 'failed',
    _message: error_message || 'Upload failed',
    _backup_id: backup_id
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Upload marked as failed'
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
