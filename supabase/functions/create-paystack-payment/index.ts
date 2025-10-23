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

    let finalAmount = amount;
    let finalCurrency = currency || "NGN";
    let exchangeRate = 1;
    let originalAmount = amount;
    let originalCurrency = currency;

    // If payment is in USD, convert to NGN using real-time exchange rate
    if (currency === "USD") {
      console.log("Converting USD to NGN for Paystack payment");
      
      try {
        // Fetch real-time exchange rate from exchangerate-api.com (free, no API key needed)
        const exchangeResponse = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        const exchangeData = await exchangeResponse.json();
        
        if (exchangeData && exchangeData.rates && exchangeData.rates.NGN) {
          exchangeRate = exchangeData.rates.NGN;
          finalAmount = amount * exchangeRate;
          finalCurrency = "NGN";
          
          console.log(`Exchange rate: 1 USD = ${exchangeRate} NGN`);
          console.log(`Converted ${amount} USD to ${finalAmount} NGN`);
        } else {
          throw new Error("Failed to fetch exchange rate");
        }
      } catch (exchangeError) {
        console.error("Exchange rate fetch error:", exchangeError);
        // Fallback to a default rate if API fails (you can update this periodically)
        exchangeRate = 1650; // Fallback rate
        finalAmount = amount * exchangeRate;
        finalCurrency = "NGN";
        console.log(`Using fallback rate: ${exchangeRate} NGN per USD`);
      }
    }

    // Create payment record with converted amount
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
        amount: finalAmount,
        currency: finalCurrency,
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
        amount: Math.round(finalAmount * 100), // Paystack expects amount in kobo
        currency: finalCurrency,
        reference: `PAY-${payment.id}`,
        callback_url: `${req.headers.get("origin")}/payment-success?payment_id=${payment.id}`,
        metadata: {
          payment_id: payment.id,
          course_id: courseId,
          student_id: user.id,
          full_name: personalInfo.fullName,
          phone: personalInfo.phone,
          original_amount: originalAmount,
          original_currency: originalCurrency,
          exchange_rate: exchangeRate,
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
        accessCode: paystackData.data.access_code,
        convertedAmount: finalAmount,
        convertedCurrency: finalCurrency,
        exchangeRate: exchangeRate,
        originalAmount: originalAmount,
        originalCurrency: originalCurrency,
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
