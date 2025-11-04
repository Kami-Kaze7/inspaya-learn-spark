-- Create course_certificates table
CREATE TABLE public.course_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id)
);

-- RLS Policies for course_certificates
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage course certificates"
  ON public.course_certificates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view certificates"
  ON public.course_certificates
  FOR SELECT
  USING (true);

-- Index for course_certificates
CREATE INDEX idx_course_certificates_course ON public.course_certificates(course_id);

-- Create certificate_status enum
CREATE TYPE certificate_status AS ENUM ('pending', 'approved', 'rejected');

-- Create certificate_requests table
CREATE TABLE public.certificate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  status certificate_status DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enrollment_id)
);

-- RLS Policies for certificate_requests
ALTER TABLE public.certificate_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own certificate requests"
  ON public.certificate_requests
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own certificate requests"
  ON public.certificate_requests
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can view all certificate requests"
  ON public.certificate_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update certificate requests"
  ON public.certificate_requests
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for certificate_requests
CREATE INDEX idx_certificate_requests_student ON public.certificate_requests(student_id);
CREATE INDEX idx_certificate_requests_status ON public.certificate_requests(status);
CREATE INDEX idx_certificate_requests_course ON public.certificate_requests(course_id);

-- Enable realtime for certificate_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.certificate_requests;

-- Create storage bucket for certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true);

-- Storage RLS Policies
CREATE POLICY "Admins can upload certificates"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'certificates' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update certificates"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'certificates' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete certificates"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'certificates' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view certificates"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'certificates');

-- Update notifications table type constraint to include certificate types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('assignment', 'grade', 'certificate_request', 'certificate_approved'));

-- Create trigger function for certificate request notifications
CREATE OR REPLACE FUNCTION notify_admin_certificate_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  course_title TEXT;
  student_name TEXT;
BEGIN
  -- Get course title
  SELECT title INTO course_title
  FROM courses
  WHERE id = NEW.course_id;

  -- Get student name
  SELECT full_name INTO student_name
  FROM profiles
  WHERE id = NEW.student_id;

  -- Create notification for all admins
  FOR admin_record IN
    SELECT user_id
    FROM user_roles
    WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_id,
      link
    ) VALUES (
      admin_record.user_id,
      'certificate_request',
      'Certificate Request',
      COALESCE(student_name, 'A student') || ' requested a certificate for "' || COALESCE(course_title, 'a course') || '"',
      NEW.id,
      '/admin/certificates'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER certificate_request_notification
  AFTER INSERT ON certificate_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_admin_certificate_request();