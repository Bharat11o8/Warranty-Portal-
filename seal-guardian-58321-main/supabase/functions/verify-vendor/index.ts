import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response("Missing verification token", { status: 400 });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find vendor by verification token
    const { data: verification, error: fetchError } = await supabaseClient
      .from("vendor_verification")
      .select("*, profiles!inner(email, name)")
      .eq("verification_token", token)
      .single();

    if (fetchError || !verification) {
      return new Response("Invalid verification token", { status: 404 });
    }

    // Update verification status
    const { error: updateError } = await supabaseClient
      .from("vendor_verification")
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("verification_token", token);

    if (updateError) throw updateError;

    // TODO: Send confirmation email to vendor when RESEND_API_KEY is configured
    console.log("Vendor verified:", verification.profiles);

    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vendor Verified</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            h1 { color: #22c55e; }
          </style>
        </head>
        <body>
          <h1>✓ Vendor Verified Successfully</h1>
          <p>The vendor has been verified and can now access the platform.</p>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-vendor:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
