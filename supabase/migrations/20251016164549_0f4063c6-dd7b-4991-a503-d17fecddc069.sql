-- Create payments table to store transaction details
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE SET NULL,
  
  -- Personal Information
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text,
  city text,
  state text,
  country text NOT NULL,
  postal_code text,
  
  -- Payment Details
  payment_method text NOT NULL CHECK (payment_method IN ('stripe', 'paystack')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  
  -- Transaction References
  stripe_session_id text,
  stripe_payment_intent_id text,
  paystack_reference text,
  paystack_access_code text,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Students can view their own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own payments"
  ON public.payments
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can view all payments"
  ON public.payments
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payments"
  ON public.payments
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add index for faster lookups
CREATE INDEX idx_payments_student_id ON public.payments(student_id);
CREATE INDEX idx_payments_course_id ON public.payments(course_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_stripe_session_id ON public.payments(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX idx_payments_paystack_reference ON public.payments(paystack_reference) WHERE paystack_reference IS NOT NULL;

-- Trigger to update updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();