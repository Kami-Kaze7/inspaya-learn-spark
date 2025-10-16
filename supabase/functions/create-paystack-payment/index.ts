import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");

    const { courseId, amount, currency, personalInfo } = await req.json();
    
    if (!courseId || !amount || !personalInfo) {
      throw new Error("Missing required fields");
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        student_id: user.id,
        course_id: courseId,
        full_name: personalInfo.fullName,
        email: personalInfo.email,
        phone: personalInfo.phone,
        address: personalInfo.address,
        city: personalInfo.city,
        state: personalInfo.state,
        country: personalInfo.country,
        postal_code: personalInfo.postalCode,
        payment_method: "paystack",
        amount,
        currency: currency || "NGN",
        status: "pending"
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Initialize Paystack transaction
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: personalInfo.email,
        amount: Math.round(amount * 100), // Paystack expects amount in kobo (NGN) or cents
        currency: currency || "NGN",
        reference: `PAY-${payment.id}`,
        callback_url: `${req.headers.get("origin")}/payment-success?payment_id=${payment.id}`,
        metadata: {
          payment_id: payment.id,
          course_id: courseId,
          student_id: user.id,
          full_name: personalInfo.fullName,
          phone: personalInfo.phone,
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      throw new Error(paystackData.message || "Failed to initialize Paystack payment");
    }

    // Update payment with Paystack details
    await supabaseClient
      .from("payments")
      .update({
        paystack_reference: paystackData.data.reference,
        paystack_access_code: paystackData.data.access_code,
      })
      .eq("id", payment.id);

    return new Response(
      JSON.stringify({
        url: paystackData.data.authorization_url,
        paymentId: payment.id,
        reference: paystackData.data.reference,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
