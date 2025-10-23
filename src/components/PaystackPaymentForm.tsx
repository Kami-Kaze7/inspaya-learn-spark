import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PaystackPaymentFormProps {
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

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export function PaystackPaymentForm({
  courseId,
  amount,
  currency,
  personalInfo,
  onSuccess,
  onCancel,
}: PaystackPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paystackKey, setPaystackKey] = useState<string>("");
  const [convertedAmount, setConvertedAmount] = useState<number>(amount);
  const [exchangeRate, setExchangeRate] = useState<number>(1);

  useEffect(() => {
    // Load Paystack script and get public key
    const init = async () => {
      const { data } = await supabase.functions.invoke("get-payment-config");
      if (data?.paystackPublicKey) {
        setPaystackKey(data.paystackPublicKey);
      }
    };
    init();

    // Load Paystack script
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Please sign in to continue");
          return;
        }

        const { data, error } = await supabase.functions.invoke("create-paystack-payment", {
          body: {
            courseId,
            amount,
            currency,
            personalInfo,
          },
        });

        if (error) throw error;

        setPaymentData(data);
        
        // Set converted amount and exchange rate if available
        if (data.convertedAmount) {
          setConvertedAmount(data.convertedAmount);
          setExchangeRate(data.exchangeRate);
        }
      } catch (error: any) {
        console.error("Error initializing payment:", error);
        toast.error(error.message || "Failed to initialize payment");
        onCancel();
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [courseId, amount, currency, personalInfo, onCancel]);

  const handlePayment = () => {
    if (!paymentData || !window.PaystackPop || !paystackKey) {
      toast.error("Payment system not ready");
      return;
    }

    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: personalInfo.email,
      amount: Math.round(convertedAmount * 100),
      currency: paymentData.convertedCurrency || currency,
      ref: paymentData.reference,
      callback: function(response: any) {
        toast.success("Payment successful!");
        onSuccess();
      },
      onClose: function() {
        toast.info("Payment cancelled");
      },
    });

    handler.openIframe();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">Payment Details</p>
        {currency === "USD" && exchangeRate > 1 ? (
          <>
            <p className="text-lg font-semibold text-muted-foreground">
              ${amount.toFixed(2)} USD
            </p>
            <p className="text-2xl font-bold text-primary">
              ₦{convertedAmount.toFixed(2)} NGN
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Exchange rate: $1 = ₦{exchangeRate.toFixed(2)}
            </p>
          </>
        ) : (
          <p className="text-2xl font-bold">
            {currency} {amount.toFixed(2)}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handlePayment}
          disabled={!paymentData}
          className="flex-1"
        >
          Pay with Paystack
        </Button>
      </div>
    </div>
  );
}