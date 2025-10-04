import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Map Stripe price IDs to subscription plans
const PRICE_TO_PLAN_MAP: Record<string, {
  plan: 'free' | 'pro' | 'business',
  max_backups: number,
  max_storage_gb: number,
  max_backup_size_gb: number,
  retention_days: number
}> = {
  'price_1SEXIeFaQO1xoKuji0E6sEEK': { // HomeSafe Pro
    plan: 'pro',
    max_backups: 10,
    max_storage_gb: 5,
    max_backup_size_gb: 2,
    retention_days: 30
  },
  'price_1SEXJ5FaQO1xoKujo8uBFZTj': { // HomeSafe Business
    plan: 'business',
    max_backups: -1, // unlimited
    max_storage_gb: 20,
    max_backup_size_gb: 5,
    retention_days: 180
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    const body = await req.text();
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Signature verified", { eventType: event.type });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("Signature verification failed", { error: errorMessage });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout.session.completed", { sessionId: session.id });

        if (session.mode !== 'subscription' || !session.customer || !session.subscription) {
          logStep("Skipping non-subscription checkout");
          break;
        }

        // Get customer email
        const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;
        if (!customer.email) {
          throw new Error("Customer email not found");
        }

        // Find user by email
        const { data: userData, error: userError } = await supabaseClient.auth.admin.listUsers();
        if (userError) throw userError;

        const user = userData.users.find(u => u.email === customer.email);
        if (!user) {
          throw new Error(`User not found for email: ${customer.email}`);
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0].price.id;
        const planConfig = PRICE_TO_PLAN_MAP[priceId];

        if (!planConfig) {
          logStep("Unknown price ID", { priceId });
          throw new Error(`Unknown price ID: ${priceId}`);
        }

        // Update or create subscription
        const { error: upsertError } = await supabaseClient
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            plan: planConfig.plan,
            stripe_customer_id: customer.id,
            stripe_subscription_id: subscription.id,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            max_backups: planConfig.max_backups,
            max_storage_gb: planConfig.max_storage_gb,
            max_backup_size_gb: planConfig.max_backup_size_gb,
            retention_days: planConfig.retention_days,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (upsertError) throw upsertError;

        logStep("Subscription created/updated", { userId: user.id, plan: planConfig.plan });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing customer.subscription.updated", { subscriptionId: subscription.id });

        const priceId = subscription.items.data[0].price.id;
        const planConfig = PRICE_TO_PLAN_MAP[priceId];

        if (!planConfig) {
          logStep("Unknown price ID", { priceId });
          break;
        }

        // Update subscription
        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .update({
            plan: planConfig.plan,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            max_backups: planConfig.max_backups,
            max_storage_gb: planConfig.max_storage_gb,
            max_backup_size_gb: planConfig.max_backup_size_gb,
            retention_days: planConfig.retention_days,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) throw updateError;

        logStep("Subscription updated", { subscriptionId: subscription.id, plan: planConfig.plan });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing customer.subscription.deleted", { subscriptionId: subscription.id });

        // Downgrade to free plan
        const { error: downgradeError } = await supabaseClient
          .from('subscriptions')
          .update({
            plan: 'free',
            stripe_subscription_id: null,
            current_period_end: null,
            max_backups: 3,
            max_storage_gb: 1,
            max_backup_size_gb: 1,
            retention_days: 7,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        if (downgradeError) throw downgradeError;

        logStep("Subscription downgraded to free", { subscriptionId: subscription.id });
        break;
      }

      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
