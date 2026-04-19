import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const invoiceId = body.invoice_id;
    if (!invoiceId) throw new Error("invoice_id is required");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find latest checkout session for this invoice via metadata
    const sessions = await stripe.checkout.sessions.list({ limit: 20 });
    const match = sessions.data.find(
      (s) => s.metadata?.invoice_id === invoiceId && s.payment_status === "paid"
    );

    if (!match) {
      return new Response(JSON.stringify({ paid: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    await admin
      .from("invoices")
      .update({ status: "paid" })
      .eq("id", invoiceId)
      .eq("user_id", user.id);

    return new Response(JSON.stringify({ paid: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("verify-invoice-payment error:", error);
    const SAFE: Record<string, string> = {
      "Missing authorization header": "Authentication required",
      "Not authenticated": "Authentication required",
      "invoice_id is required": "Invalid request",
    };
    const msg = SAFE[error?.message] ?? "Unable to verify payment";
    const status = msg === "Authentication required" ? 401 : 400;
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});
