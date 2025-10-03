import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get API key from header
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key and get user_id
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id, revoked_at')
      .eq('key_hash', apiKey)
      .single();

    if (keyError || !keyData || keyData.revoked_at) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or revoked API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = keyData.user_id;

    // Update last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', apiKey);

    // Get action from query params
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'init';

    if (action === 'init') {
      return await handleInit(req, supabase, userId);
    } else if (action === 'complete') {
      return await handleComplete(req, supabase, userId);
    } else if (action === 'fail') {
      return await handleFail(req, supabase, userId);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleInit(req: Request, supabase: any, userId: string) {
  const body = await req.json();
  const { file_size, ha_version } = body;

  if (!file_size) {
    return new Response(
      JSON.stringify({ success: false, error: 'file_size is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get user subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (subError || !subscription) {
    return new Response(
      JSON.stringify({ success: false, error: 'Subscription not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check max backup size limit
  const fileSizeGB = file_size / (1024 * 1024 * 1024);
  if (fileSizeGB > subscription.max_backup_size_gb) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Backup size (${fileSizeGB.toFixed(2)} GB) exceeds plan limit (${subscription.max_backup_size_gb} GB)`
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Count existing backups
  const { count: backupCount, error: countError } = await supabase
    .from('backups')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('status', 'deleted');

  if (countError) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to check backup count' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (backupCount && backupCount >= subscription.max_backups) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Maximum backup limit reached (${subscription.max_backups}). Delete old backups first.`
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Calculate total storage used
  const { data: backups, error: storageError } = await supabase
    .from('backups')
    .select('size_bytes')
    .eq('user_id', userId)
    .neq('status', 'deleted');

  if (storageError) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to check storage usage' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const totalStorageBytes = (backups || []).reduce((sum: number, b: any) => sum + (b.size_bytes || 0), 0);
  const totalStorageGB = totalStorageBytes / (1024 * 1024 * 1024);
  const maxStorageGB = subscription.max_storage_gb;

  if (totalStorageGB + fileSizeGB > maxStorageGB) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Total storage would exceed limit (${(totalStorageGB + fileSizeGB).toFixed(2)} GB / ${maxStorageGB} GB)`
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Generate filename and storage path
  const timestamp = Date.now();
  const filename = `backup-${timestamp}.tar`;
  const storagePath = `${userId}/${timestamp}-${filename}`;

  // Create backup record in Supabase
  const { data: backup, error: backupError } = await supabase
    .from('backups')
    .insert({
      user_id: userId,
      filename: filename,
      storage_path: storagePath,
      size_bytes: file_size,
      ha_version: ha_version || 'unknown',
      status: 'uploading'
    })
    .select()
    .single();

  if (backupError || !backup) {
    console.error('Failed to create backup record:', backupError);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to create backup record' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get Baserow configuration (normalize URL by removing trailing slash)
  const baserowUrl = (Deno.env.get('BASEROW_API_URL') || 'https://baserow.avensat.com').replace(/\/$/, '');
  const baserowToken = Deno.env.get('BASEROW_API_TOKEN');
  const baserowTableId = Deno.env.get('BASEROW_TABLE_ID') || '708';

  if (!baserowToken) {
    return new Response(
      JSON.stringify({ success: false, error: 'Baserow API token not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create row in Baserow with initial data
  const baserowResponse = await fetch(
    `${baserowUrl}/api/database/rows/table/${baserowTableId}/`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Token ${baserowToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: filename,
        size_bytes: file_size,
        ha_version: ha_version || 'unknown',
        status: 'uploading',
        created_at: new Date().toISOString()
      })
    }
  );

  if (!baserowResponse.ok) {
    const errorText = await baserowResponse.text();
    console.error('Failed to create Baserow row:', errorText);
    return new Response(
      JSON.stringify({ success: false, error: `Failed to create Baserow row: ${errorText}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const baserowData = await baserowResponse.json();
  const rowId = baserowData.id;

  // Log initialization
  await supabase.from('backup_logs').insert({
    user_id: userId,
    backup_id: backup.id,
    action: 'upload_init',
    status: 'success',
    message: `Backup upload initialized (Baserow): ${filename}`
  });

  return new Response(
    JSON.stringify({
      success: true,
      backup_id: backup.id,
      row_id: rowId,
      filename: filename,
      baserow_url: baserowUrl,
      baserow_table_id: baserowTableId
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleComplete(req: Request, supabase: any, userId: string) {
  const body = await req.json();
  const { backup_id } = body;

  if (!backup_id) {
    return new Response(
      JSON.stringify({ success: false, error: 'backup_id is required' }),
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
      JSON.stringify({ success: false, error: 'Backup not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Update backup status in Supabase
  const { error: updateError } = await supabase
    .from('backups')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', backup_id);

  if (updateError) {
    console.error('Failed to update backup status:', updateError);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update backup status' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Log completion
  await supabase.from('backup_logs').insert({
    user_id: userId,
    backup_id: backup_id,
    action: 'upload_complete',
    status: 'success',
    message: `Backup uploaded successfully (Baserow): ${backup.filename}`
  });

  return new Response(
    JSON.stringify({ success: true, message: 'Backup completed successfully' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleFail(req: Request, supabase: any, userId: string) {
  const body = await req.json();
  const { backup_id, error_message } = body;

  if (!backup_id) {
    return new Response(
      JSON.stringify({ success: false, error: 'backup_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Update backup status in Supabase
  const { error: updateError } = await supabase
    .from('backups')
    .update({
      status: 'failed',
      error_message: error_message || 'Upload failed'
    })
    .eq('id', backup_id)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Failed to update backup status:', updateError);
  }

  // Log failure
  await supabase.from('backup_logs').insert({
    user_id: userId,
    backup_id: backup_id,
    action: 'upload_fail',
    status: 'failed',
    message: error_message || 'Backup upload failed (Baserow)'
  });

  return new Response(
    JSON.stringify({ success: true, message: 'Failure logged' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
