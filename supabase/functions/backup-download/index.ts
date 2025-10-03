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
      .select('baserow_row_id, filename')
      .eq('id', backupId)
      .eq('user_id', user.id)
      .single();

    if (backupError || !backup) {
      return new Response(
        JSON.stringify({ error: 'Backup not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!backup.baserow_row_id) {
      return new Response(
        JSON.stringify({ error: 'Backup row ID not found in Baserow (old backup)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Baserow configuration
    const baserowUrl = (Deno.env.get('BASEROW_API_URL') || 'https://baserow.avensat.com').replace(/\/$/, '');
    const baserowToken = Deno.env.get('BASEROW_API_TOKEN');
    const baserowTableId = Deno.env.get('BASEROW_TABLE_ID') || '708';

    // Fetch row from Baserow to get file field
    const baserowResponse = await fetch(
      `${baserowUrl}/api/database/rows/table/${baserowTableId}/${backup.baserow_row_id}/`,
      {
        headers: {
          'Authorization': `Token ${baserowToken}`,
        }
      }
    );

    if (!baserowResponse.ok) {
      console.error('Failed to fetch from Baserow:', await baserowResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to get file from Baserow' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baserowData = await baserowResponse.json();
    
    // Baserow file field structure: array with { url: "https://...", name: "..." }
    const fileField = baserowData.file;
    
    if (!fileField || !Array.isArray(fileField) || !fileField[0]?.url) {
      return new Response(
        JSON.stringify({ error: 'File not found in Baserow' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const downloadUrl = fileField[0].url;

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
