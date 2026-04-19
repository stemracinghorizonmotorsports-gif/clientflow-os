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
    if (!invoiceId || typeof invoiceId !== "string") {
      throw new Error("invoice_id is required");
    }

    // Use service role to read invoice safely (still scoped by user_id check)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { data: invoice, error: invErr } = await admin
      .from("invoices")
      .select("id, invoice_number, amount, status, user_id, client_id, clients(name, email)")
      .eq("id", invoiceId)
      .maybeSingle();
    if (invErr || !invoice) throw new Error("Invoice not found");
    if (invoice.user_id !== user.id) throw new Error("Forbidden");
    if (invoice.status === "paid") throw new Error("Invoice already paid");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customerEmail =
      (invoice.clients as any)?.email || user.email || undefined;

    const origin = req.headers.get("origin") || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: (invoice.clients as any)?.name
                ? `For ${(invoice.clients as any).name}`
                : undefined,
            },
            unit_amount: Math.round(Number(invoice.amount) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoice_id: invoice.id,
        user_id: user.id,
      },
      success_url: `${origin}/billing?payment=success&invoice=${invoice.id}`,
      cancel_url: `${origin}/billing?payment=cancelled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("create-invoice-payment error:", error);
    const SAFE: Record<string, string> = {
      "Missing authorization header": "Authentication required",
      "Not authenticated": "Authentication required",
      "invoice_id is required": "Invalid request",
      "Invoice not found": "Invoice not found",
      "Forbidden": "Forbidden",
      "Invoice already paid": "Invoice already paid",
    };
    const msg = SAFE[error?.message] ?? "Unable to start payment";
    const status = msg === "Authentication required" ? 401
      : msg === "Forbidden" ? 403
      : msg === "Invoice not found" ? 404
      : 400;
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});
