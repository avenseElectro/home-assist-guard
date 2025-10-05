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
    // Get API key from header
    const apiKey = req.headers.get('x-api-key');
    
    if (!apiKey) {
      console.error('No API key provided');
      return new Response(
        JSON.stringify({ error: 'API key required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role to validate API key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all non-revoked API keys
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('id, user_id, key_hash')
      .is('revoked_at', null);

    if (keysError) {
      console.error('Error fetching API keys:', keysError);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash the provided API key using SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const providedKeyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Looking for matching API key...');

    // Find matching API key by comparing SHA-256 hashes
    const matchedKey = (apiKeys || []).find(key => key.key_hash === providedKeyHash);

    if (!matchedKey) {
      console.error('Invalid API key');
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Valid API key found for user: ${matchedKey.user_id}`);

    // Update last_used_at for the API key
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', matchedKey.id);

    // Get user's backups
    const { data: backups, error: backupsError } = await supabase
      .from('backups')
      .select('*')
      .eq('user_id', matchedKey.user_id)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .limit(10);

    if (backupsError) {
      console.error('Failed to fetch backups:', backupsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch backups' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Returning ${backups?.length || 0} backups for user ${matchedKey.user_id}`);

    return new Response(
      JSON.stringify({ backups: backups || [] }),
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
