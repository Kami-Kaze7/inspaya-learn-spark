import { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = async () => {
  if (!stripePromise) {
    const { data } = await supabase.functions.invoke("get-payment-config");
    if (data?.stripePublishableKey) {
      stripePromise = loadStripe(data.stripePublishableKey);
    }
  }
  return stripePromise;
};

interface StripePaymentFormProps {
  courseId: string;
  amount: number;
  currency: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

function CheckoutForm({ 
  courseId, 
  amount, 
  currency, 
  personalInfo, 
  onSuccess,
  onCancel 
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    try {
      setIsProcessing(true);

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Payment failed");
      } else {
        toast.success("Payment successful!");
        onSuccess();
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing}
          className="flex-1"
        >
          {isProcessing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
}

export function StripePaymentForm(props: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  // Initialize payment on mount
  const initializePayment = async () => {
    try {
      // Get Stripe instance
      const stripe = await getStripe();
      setStripePromise(Promise.resolve(await stripe));

      const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Please sign in to continue");
          return;
        }

        const { data, error } = await supabase.functions.invoke("create-stripe-payment-intent", {
          body: {
            courseId: props.courseId,
            amount: props.amount,
            currency: props.currency,
            personalInfo: props.personalInfo,
          },
        });

        if (error) throw error;

        setClientSecret(data.clientSecret);
      } catch (error: any) {
        console.error("Error creating payment intent:", error);
        toast.error(error.message || "Failed to initialize payment");
        props.onCancel();
      } finally {
        setLoading(false);
      }
    };
  
  useEffect(() => {
    initializePayment();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!clientSecret || !stripePromise) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to initialize payment</p>
        <Button onClick={props.onCancel} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm {...props} />
    </Elements>
  );
}