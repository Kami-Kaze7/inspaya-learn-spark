-- Create course_instructors junction table for assigning instructors to courses
CREATE TABLE public.course_instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(course_id, instructor_id)
);

-- Enable RLS
ALTER TABLE public.course_instructors ENABLE ROW LEVEL SECURITY;

-- Admins can manage all instructor assignments
CREATE POLICY "Admins can manage course instructor assignments"
ON public.course_instructors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Instructors can view their own assignments
CREATE POLICY "Instructors can view their assignments"
ON public.course_instructors
FOR SELECT
USING (auth.uid() = instructor_id);

-- Create indexes for performance
CREATE INDEX idx_course_instructors_course_id ON public.course_instructors(course_id);
CREATE INDEX idx_course_instructors_instructor_id ON public.course_instructors(instructor_id);

-- Function to check if user has instructor access to a course
CREATE OR REPLACE FUNCTION public.has_course_access(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = _course_id AND instructor_id = _user_id
    
    UNION
    
    SELECT 1 FROM public.course_instructors 
    WHERE course_id = _course_id AND instructor_id = _user_id
  )
$$;