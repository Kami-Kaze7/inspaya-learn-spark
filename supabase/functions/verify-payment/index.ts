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

    const { paymentId, stripeSessionId, paystackReference } = await req.json();

    if (!paymentId) {
      throw new Error("Payment ID is required");
    }

    // Fetch payment record
    const { data: payment, error: fetchError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .eq("student_id", user.id)
      .single();

    if (fetchError || !payment) {
      throw new Error("Payment not found");
    }

    let verified = false;
    let paymentIntentId = null;

    if (payment.payment_method === "stripe" && stripeSessionId) {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2025-08-27.basil",
      });

      const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
      verified = session.payment_status === "paid";
      paymentIntentId = session.payment_intent as string;

    } else if (payment.payment_method === "paystack" && paystackReference) {
      const paystackResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${paystackReference}`,
        {
          headers: {
            Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
          },
        }
      );

      const paystackData = await paystackResponse.json();
      verified = paystackData.status && paystackData.data.status === "success";
    }

    if (verified) {
      // Update payment status
      await supabaseClient
        .from("payments")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          ...(paymentIntentId && { stripe_payment_intent_id: paymentIntentId }),
        })
        .eq("id", paymentId);

      // Create or update enrollment
      const { data: existingEnrollment } = await supabaseClient
        .from("enrollments")
        .select("id")
        .eq("student_id", user.id)
        .eq("course_id", payment.course_id)
        .single();

      if (existingEnrollment) {
        await supabaseClient
          .from("enrollments")
          .update({
            payment_verified: true,
            status: "active",
          })
          .eq("id", existingEnrollment.id);

        await supabaseClient
          .from("payments")
          .update({ enrollment_id: existingEnrollment.id })
          .eq("id", paymentId);
      } else {
        const { data: newEnrollment } = await supabaseClient
          .from("enrollments")
          .insert({
            student_id: user.id,
            course_id: payment.course_id,
            payment_verified: true,
            status: "active",
          })
          .select()
          .single();

        if (newEnrollment) {
          await supabaseClient
            .from("payments")
            .update({ enrollment_id: newEnrollment.id })
            .eq("id", paymentId);
        }
      }

      return new Response(
        JSON.stringify({ verified: true, message: "Payment verified successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // Update payment status to failed
      await supabaseClient
        .from("payments")
        .update({ status: "failed" })
        .eq("id", paymentId);

      return new Response(
        JSON.stringify({ verified: false, message: "Payment verification failed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
