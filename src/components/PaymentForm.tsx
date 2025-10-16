import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CreditCard, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StripePaymentForm } from "./StripePaymentForm";
import { PaystackPaymentForm } from "./PaystackPaymentForm";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  country: z.string().min(2, "Country is required"),
  postalCode: z.string().min(3, "Postal code must be at least 3 characters"),
  paymentMethod: z.enum(["stripe", "paystack"]),
});

interface PaymentFormProps {
  courseId: string;
  amount: number;
  currency?: string;
  onSuccess?: () => void;
}

export function PaymentForm({ courseId, amount, currency = "USD", onSuccess }: PaymentFormProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      paymentMethod: "stripe",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setShowPaymentForm(true);
  };

  if (showPaymentForm) {
    const personalInfo = {
      fullName: form.getValues("fullName"),
      email: form.getValues("email"),
      phone: form.getValues("phone"),
      address: form.getValues("address"),
      city: form.getValues("city"),
      state: form.getValues("state"),
      country: form.getValues("country"),
      postalCode: form.getValues("postalCode"),
    };

    if (form.getValues("paymentMethod") === "stripe") {
      return (
        <StripePaymentForm
          courseId={courseId}
          amount={amount}
          currency={currency}
          personalInfo={personalInfo}
          onSuccess={onSuccess || (() => {})}
          onCancel={() => setShowPaymentForm(false)}
        />
      );
    } else {
      return (
        <PaystackPaymentForm
          courseId={courseId}
          amount={amount}
          currency={currency === "USD" ? "NGN" : currency}
          personalInfo={personalInfo}
          onSuccess={onSuccess || (() => {})}
          onCancel={() => setShowPaymentForm(false)}
        />
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Personal Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="United States" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="New York" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Province</FormLabel>
                  <FormControl>
                    <Input placeholder="NY" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="10001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Payment Method</h3>

          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="stripe"
                        id="stripe"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="stripe"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <CreditCard className="mb-3 h-6 w-6" />
                        <div className="text-center">
                          <div className="font-semibold">Stripe</div>
                          <div className="text-xs text-muted-foreground">
                            Credit/Debit Card
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="paystack"
                        id="paystack"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="paystack"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <DollarSign className="mb-3 h-6 w-6" />
                        <div className="text-center">
                          <div className="font-semibold">Paystack</div>
                          <div className="text-xs text-muted-foreground">
                            Multiple Payment Options
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-lg font-semibold">
            Total: ${amount.toFixed(2)}
          </div>
          <Button type="submit" size="lg">
            Continue to Payment
          </Button>
        </div>
      </form>
    </Form>
  );
}
