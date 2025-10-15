import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: VerificationRequest = await req.json();
    
    // TODO: Replace with actual email service when RESEND_API_KEY is configured
    // For now, log the verification request
    console.log("Vendor verification request:", {
      vendorEmail: email,
      vendorName: name,
      representativeEmail: "marketing@autoformindia.com",
    });

    // When RESEND_API_KEY is available, uncomment and use:
    /*
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    await resend.emails.send({
      from: "Warranty Portal <noreply@yourdomain.com>",
      to: ["marketing@autoformindia.com"],
      subject: "New Vendor Registration - Verification Required",
      html: `
        <h2>New Vendor Registration</h2>
        <p>A new vendor has registered and requires verification:</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
        </ul>
        <p>Please verify this vendor by clicking the link below:</p>
        <a href="${Deno.env.get("SUPABASE_URL")}/functions/v1/verify-vendor?token=${verificationToken}">
          Verify Vendor
        </a>
      `,
    });
    */

    return new Response(
      JSON.stringify({ success: true, message: "Verification email will be sent when configured" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-vendor-verification:", error);
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
