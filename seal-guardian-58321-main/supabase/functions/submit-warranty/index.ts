import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WarrantySubmission {
  productType: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  carMake: string;
  carModel: string;
  carYear: string;
  registrationNumber: string;
  purchaseDate: string;
  installerName?: string;
  installerContact?: string;
  productDetails: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const warrantyData: WarrantySubmission = await req.json();

    const { data, error } = await supabaseClient
      .from("warranty_registrations")
      .insert({
        user_id: user.id,
        product_type: warrantyData.productType,
        customer_name: warrantyData.customerName,
        customer_email: warrantyData.customerEmail,
        customer_phone: warrantyData.customerPhone,
        customer_address: warrantyData.customerAddress,
        car_make: warrantyData.carMake,
        car_model: warrantyData.carModel,
        car_year: warrantyData.carYear,
        registration_number: warrantyData.registrationNumber,
        purchase_date: warrantyData.purchaseDate,
        installer_name: warrantyData.installerName,
        installer_contact: warrantyData.installerContact,
        product_details: warrantyData.productDetails,
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Send confirmation email when RESEND_API_KEY is configured
    console.log("Warranty registration created:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in submit-warranty:", error);
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
