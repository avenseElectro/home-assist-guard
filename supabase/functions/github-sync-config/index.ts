import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const method = req.method;
    
    // GET - Fetch user settings
    if (method === 'GET') {
      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Failed to fetch settings:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch settings' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ settings: settings || null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST/PUT - Update settings
    if (method === 'POST' || method === 'PUT') {
      const body = await req.json();
      
      // Validate required fields for GitHub
      if (body.github_enabled) {
        if (!body.github_token || !body.github_repo) {
          return new Response(
            JSON.stringify({ error: 'GitHub token and repository are required when enabling GitHub sync' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Check if settings exist
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let result;
      
      if (existing) {
        // Update existing settings
        result = await supabase
          .from('user_settings')
          .update({
            github_token: body.github_token,
            github_repo: body.github_repo,
            github_branch: body.github_branch || 'main',
            github_enabled: body.github_enabled || false,
            dropbox_token: body.dropbox_token,
            dropbox_enabled: body.dropbox_enabled || false,
            s3_bucket: body.s3_bucket,
            s3_region: body.s3_region,
            s3_access_key: body.s3_access_key,
            s3_secret_key: body.s3_secret_key,
            s3_enabled: body.s3_enabled || false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Insert new settings
        result = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            github_token: body.github_token,
            github_repo: body.github_repo,
            github_branch: body.github_branch || 'main',
            github_enabled: body.github_enabled || false,
            dropbox_token: body.dropbox_token,
            dropbox_enabled: body.dropbox_enabled || false,
            s3_bucket: body.s3_bucket,
            s3_region: body.s3_region,
            s3_access_key: body.s3_access_key,
            s3_secret_key: body.s3_secret_key,
            s3_enabled: body.s3_enabled || false,
          });
      }

      if (result.error) {
        console.error('Failed to save settings:', result.error);
        return new Response(
          JSON.stringify({ error: 'Failed to save settings' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Settings saved successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
