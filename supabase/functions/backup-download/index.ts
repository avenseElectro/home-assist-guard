import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { backupId } = await req.json();

    if (!backupId) {
      return new Response(
        JSON.stringify({ error: 'backupId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get backup details
    const { data: backup, error: backupError } = await supabase
      .from('backups')
      .select('storage_path, filename, status')
      .eq('id', backupId)
      .eq('user_id', user.id)
      .single();

    if (backupError || !backup) {
      return new Response(
        JSON.stringify({ error: 'Backup not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (backup.status !== 'completed') {
      return new Response(
        JSON.stringify({ error: 'Backup not ready for download' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signed download URL from Supabase Storage (valid for 1 hour)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('backups')
      .createSignedUrl(backup.storage_path, 3600);

    if (signedError || !signedData) {
      console.error('Failed to create signed URL:', signedError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate download URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const downloadUrl = signedData.signedUrl;

    // Log download
    await supabase.from('backup_logs').insert({
      user_id: user.id,
      backup_id: backupId,
      action: 'download',
      status: 'success',
      message: `Backup download initiated: ${backup.filename}`
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        download_url: downloadUrl,
        filename: backup.filename 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
