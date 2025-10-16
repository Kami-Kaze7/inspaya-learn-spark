import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentCancelled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-16 w-16 text-orange-500" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-orange-600">
                Payment Was Cancelled
              </h3>
              <p className="text-muted-foreground">
                You cancelled the payment process. No charges were made.
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
        </CardContent>
      </Card>
    </div>
  );
}
