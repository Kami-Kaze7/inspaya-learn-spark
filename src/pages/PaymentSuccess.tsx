import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  const paymentId = searchParams.get("payment_id");
  const sessionId = searchParams.get("session_id");
  const reference = searchParams.get("reference");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!paymentId) {
        toast.error("Invalid payment information");
        navigate("/");
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Please sign in to continue");
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: {
            paymentId,
            stripeSessionId: sessionId,
            paystackReference: reference,
          },
        });

        if (error) throw error;

        if (data?.verified) {
          setVerified(true);
          toast.success("Payment verified successfully!");
        } else {
          toast.error("Payment verification failed");
        }
      } catch (error: any) {
        console.error("Verification error:", error);
        toast.error(error.message || "Failed to verify payment");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [paymentId, sessionId, reference, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {isVerifying ? "Verifying Payment..." : "Payment Status"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {isVerifying ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Please wait while we verify your payment...
              </p>
            </div>
          ) : verified ? (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-green-600">
                  Payment Successful!
                </h3>
                <p className="text-muted-foreground">
                  Your enrollment has been confirmed. You can now access the course.
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <Button onClick={() => navigate("/student/courses")} variant="outline">
                  View My Courses
                </Button>
                <Button onClick={() => navigate("/")}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-3xl">✕</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-red-600">
                  Payment Failed
                </h3>
                <p className="text-muted-foreground">
                  We couldn't verify your payment. Please try again or contact support.
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <Button onClick={() => navigate(-1)} variant="outline">
                  Try Again
                </Button>
                <Button onClick={() => navigate("/")}>
                  Go Home
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
