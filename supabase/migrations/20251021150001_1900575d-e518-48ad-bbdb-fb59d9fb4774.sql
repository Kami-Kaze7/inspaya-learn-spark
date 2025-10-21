-- Add lesson_id to assignments table to link assignments to specific course videos
ALTER TABLE public.assignments
ADD COLUMN lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_assignments_lesson_id ON public.assignments(lesson_id);

-- Create table for student assignment submissions
CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  file_url text,
  submitted_at timestamp with time zone DEFAULT now(),
  grade numeric,
  feedback text,
  status text DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'pending')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- Enable RLS on assignment_submissions
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for assignment_submissions
CREATE POLICY "Students can view their own submissions"
ON public.assignment_submissions
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own submissions"
ON public.assignment_submissions
FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own submissions"
ON public.assignment_submissions
FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Admins and instructors can view all submissions"
ON public.assignment_submissions
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM assignments a
    JOIN courses c ON c.id = a.course_id
    WHERE a.id = assignment_submissions.assignment_id
    AND c.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins and instructors can update submissions"
ON public.assignment_submissions
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM assignments a
    JOIN courses c ON c.id = a.course_id
    WHERE a.id = assignment_submissions.assignment_id
    AND c.instructor_id = auth.uid()
  )
);