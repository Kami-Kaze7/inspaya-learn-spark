-- Create modules table for organizing course content
CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  video_duration TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  content TEXT,
  is_free BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_modules
CREATE POLICY "Everyone can view modules for published courses"
  ON public.course_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_modules.course_id 
      AND (courses.status = 'published' OR courses.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Admins and instructors can create modules"
  ON public.course_modules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_modules.course_id 
      AND (courses.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Admins and instructors can update their modules"
  ON public.course_modules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_modules.course_id 
      AND (courses.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Admins and instructors can delete their modules"
  ON public.course_modules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_modules.course_id 
      AND (courses.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- RLS Policies for course_lessons
CREATE POLICY "Everyone can view lessons for published courses"
  ON public.course_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_modules 
      JOIN public.courses ON courses.id = course_modules.course_id
      WHERE course_modules.id = course_lessons.module_id 
      AND (courses.status = 'published' OR courses.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Admins and instructors can create lessons"
  ON public.course_lessons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.course_modules 
      JOIN public.courses ON courses.id = course_modules.course_id
      WHERE course_modules.id = course_lessons.module_id 
      AND (courses.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Admins and instructors can update their lessons"
  ON public.course_lessons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.course_modules 
      JOIN public.courses ON courses.id = course_modules.course_id
      WHERE course_modules.id = course_lessons.module_id 
      AND (courses.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Admins and instructors can delete their lessons"
  ON public.course_lessons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.course_modules 
      JOIN public.courses ON courses.id = course_modules.course_id
      WHERE course_modules.id = course_lessons.module_id 
      AND (courses.instructor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX idx_course_modules_order ON public.course_modules(course_id, order_index);
CREATE INDEX idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX idx_course_lessons_order ON public.course_lessons(module_id, order_index);

-- Add triggers for updated_at
CREATE TRIGGER update_course_modules_updated_at
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_course_lessons_updated_at
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();