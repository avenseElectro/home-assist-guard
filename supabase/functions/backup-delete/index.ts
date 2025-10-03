import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[backup-delete] Request received:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[backup-delete] Creating Supabase client');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    console.log('[backup-delete] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('[backup-delete] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[backup-delete] Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[backup-delete] User authenticated:', user.id);

    // Get backup ID from URL
    const url = new URL(req.url);
    const backupId = url.pathname.split('/').pop();

    if (!backupId) {
      return new Response(
        JSON.stringify({ error: 'Missing backup ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get backup details
    console.log('[backup-delete] Fetching backup:', backupId, 'for user:', user.id);
    const { data: backup, error: fetchError } = await supabase
      .from('backups')
      .select('*')
      .eq('id', backupId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError || !backup) {
      console.error('[backup-delete] Backup not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Backup not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[backup-delete] Backup found:', backup.filename, 'Status:', backup.status);

    // Delete from storage (only if backup was successfully uploaded)
    if (backup.status === 'completed') {
      console.log('[backup-delete] Deleting from storage:', backup.storage_path);
      const { error: storageError } = await supabase.storage
        .from('backups')
        .remove([backup.storage_path]);

      if (storageError) {
        console.error('[backup-delete] Failed to delete from storage:', storageError);
        // Continue anyway - we still want to mark as deleted in DB
      }
    } else {
      console.log('[backup-delete] Skipping storage deletion for failed/incomplete backup');
    }

    // Mark as deleted in database
    const { error: deleteError } = await supabase
      .from('backups')
      .update({ status: 'deleted' })
      .eq('id', backupId);

    if (deleteError) {
      console.error('Failed to mark backup as deleted:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete backup' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log deletion
    await supabase.from('backup_logs').insert({
      user_id: user.id,
      backup_id: backupId,
      action: 'delete',
      status: 'success',
      message: `Backup deleted: ${backup.filename}`
    });

    return new Response(
      JSON.stringify({ success: true }),
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