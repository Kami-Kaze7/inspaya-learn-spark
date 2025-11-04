-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_submissions table
CREATE TABLE public.project_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  submission_type TEXT NOT NULL,
  file_url TEXT,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  grade NUMERIC,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Admins and instructors can create projects"
ON public.projects FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = projects.course_id
    AND courses.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins and instructors can update projects"
ON public.projects FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = projects.course_id
    AND courses.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins and instructors can delete projects"
ON public.projects FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = projects.course_id
    AND courses.instructor_id = auth.uid()
  )
);

CREATE POLICY "Students can view projects for enrolled courses"
ON public.projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.student_id = auth.uid()
    AND enrollments.course_id = projects.course_id
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = projects.course_id
    AND courses.instructor_id = auth.uid()
  )
);

-- Enable RLS on project_submissions table
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;

-- Project submissions policies
CREATE POLICY "Students can create their own submissions"
ON public.project_submissions FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own submissions"
ON public.project_submissions FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Students can view their own submissions"
ON public.project_submissions FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Admins and instructors can view all submissions"
ON public.project_submissions FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.projects
    JOIN public.courses ON courses.id = projects.course_id
    WHERE projects.id = project_submissions.project_id
    AND courses.instructor_id = auth.uid()
  )
);

CREATE POLICY "Admins and instructors can update submissions"
ON public.project_submissions FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.projects
    JOIN public.courses ON courses.id = projects.course_id
    WHERE projects.id = project_submissions.project_id
    AND courses.instructor_id = auth.uid()
  )
);

-- Add trigger for project_submissions updated_at
CREATE TRIGGER update_project_submissions_updated_at
BEFORE UPDATE ON public.project_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();