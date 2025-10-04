import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { webhook_id } = await req.json();

    if (!webhook_id) {
      return new Response(
        JSON.stringify({ error: 'webhook_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch webhook config
    const { data: webhook, error: webhookError } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('id', webhook_id)
      .eq('user_id', user.id)
      .single();

    if (webhookError || !webhook) {
      return new Response(
        JSON.stringify({ error: 'Webhook not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare test payload
    const testPayload = {
      event: 'test.ping',
      timestamp: new Date().toISOString(),
      message: 'This is a test webhook from HomeSafe',
      webhook_name: webhook.name,
    };

    console.log(`Sending test webhook to: ${webhook.webhook_url}`);

    // Send test webhook
    let status = 'failed';
    let responseCode: number | null = null;
    let errorMessage: string | null = null;

    try {
      const response = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HomeSafe-Webhook/1.0',
        },
        body: JSON.stringify(testPayload),
      });

      responseCode = response.status;
      status = response.ok ? 'success' : 'failed';
      
      if (!response.ok) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      console.log(`Webhook response: ${responseCode} - ${status}`);
    } catch (error) {
      console.error('Webhook delivery error:', error);
      errorMessage = (error as Error).message;
      status = 'failed';
    }

    // Log the test attempt
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        webhook_id: webhook.id,
        event_type: 'test.ping',
        status,
        response_code: responseCode,
        error_message: errorMessage,
        payload: testPayload,
      });

    if (logError) {
      console.error('Error logging webhook test:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: status === 'success',
        status,
        response_code: responseCode,
        error_message: errorMessage,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in webhook-test function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
