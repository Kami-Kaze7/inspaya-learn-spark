import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
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
        payment_method: "stripe",
        amount,
        currency: currency || "USD",
        status: "pending"
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Create a Payment Intent instead of a Checkout Session
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: (currency || "usd").toLowerCase(),
      description: `Course Enrollment Payment`,
      receipt_email: personalInfo.email,
      metadata: {
        payment_id: payment.id,
        course_id: courseId,
        student_id: user.id,
      },
    });

    // Update payment with Stripe payment intent ID
    await supabaseClient
      .from("payments")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", payment.id);

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret, 
        paymentId: payment.id 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});