-- Fix instructor visibility for assigned instructors (course_instructors)
-- Keep admin and student access intact while adding has_course_access checks.

-- COURSES
DROP POLICY IF EXISTS "Everyone can view published courses" ON public.courses;
CREATE POLICY "Everyone can view published courses"
ON public.courses
FOR SELECT
USING (
  status = 'published'::public.course_status
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), id)
);

DROP POLICY IF EXISTS "Admins and course instructors can update courses" ON public.courses;
CREATE POLICY "Admins and course instructors can update courses"
ON public.courses
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), id)
);

-- ENROLLMENTS (used by instructor dashboard/students)
DROP POLICY IF EXISTS "Students can view their enrollments" ON public.enrollments;
CREATE POLICY "Students can view their enrollments"
ON public.enrollments
FOR SELECT
USING (
  auth.uid() = student_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), course_id)
);

-- ASSIGNMENTS
DROP POLICY IF EXISTS "Instructors can create assignments for their courses" ON public.assignments;
CREATE POLICY "Instructors can create assignments for their courses"
ON public.assignments
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), course_id)
);

DROP POLICY IF EXISTS "Instructors can update their assignments" ON public.assignments;
CREATE POLICY "Instructors can update their assignments"
ON public.assignments
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), course_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), course_id)
);

DROP POLICY IF EXISTS "Students can view assignments for enrolled courses" ON public.assignments;
CREATE POLICY "Students can view assignments for enrolled courses"
ON public.assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE enrollments.student_id = auth.uid()
      AND enrollments.course_id = assignments.course_id
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), course_id)
);

-- PROJECTS
DROP POLICY IF EXISTS "Admins and instructors can create projects" ON public.projects;
CREATE POLICY "Admins and instructors can create projects"
ON public.projects
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), course_id)
);

DROP POLICY IF EXISTS "Admins and instructors can update projects" ON public.projects;
CREATE POLICY "Admins and instructors can update projects"
ON public.projects
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), course_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), course_id)
);

DROP POLICY IF EXISTS "Admins and instructors can delete projects" ON public.projects;
CREATE POLICY "Admins and instructors can delete projects"
ON public.projects
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), course_id)
);

DROP POLICY IF EXISTS "Students can view projects for enrolled courses" ON public.projects;
CREATE POLICY "Students can view projects for enrolled courses"
ON public.projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE enrollments.student_id = auth.uid()
      AND enrollments.course_id = projects.course_id
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), course_id)
);

-- ASSIGNMENT SUBMISSIONS
DROP POLICY IF EXISTS "Admins and instructors can view all submissions" ON public.assignment_submissions;
CREATE POLICY "Admins and instructors can view all submissions"
ON public.assignment_submissions
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND public.has_course_access(auth.uid(), a.course_id)
  )
);

DROP POLICY IF EXISTS "Admins and instructors can update submissions" ON public.assignment_submissions;
CREATE POLICY "Admins and instructors can update submissions"
ON public.assignment_submissions
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND public.has_course_access(auth.uid(), a.course_id)
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id
      AND public.has_course_access(auth.uid(), a.course_id)
  )
);

-- PROJECT SUBMISSIONS
DROP POLICY IF EXISTS "Admins and instructors can view all submissions" ON public.project_submissions;
CREATE POLICY "Admins and instructors can view all submissions"
ON public.project_submissions
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_submissions.project_id
      AND public.has_course_access(auth.uid(), p.course_id)
  )
);

DROP POLICY IF EXISTS "Admins and instructors can update submissions" ON public.project_submissions;
CREATE POLICY "Admins and instructors can update submissions"
ON public.project_submissions
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_submissions.project_id
      AND public.has_course_access(auth.uid(), p.course_id)
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = project_submissions.project_id
      AND public.has_course_access(auth.uid(), p.course_id)
  )
);

-- COURSE MODULES
DROP POLICY IF EXISTS "Admins and instructors can create modules" ON public.course_modules;
CREATE POLICY "Admins and instructors can create modules"
ON public.course_modules
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), course_id)
);

DROP POLICY IF EXISTS "Admins and instructors can update their modules" ON public.course_modules;
CREATE POLICY "Admins and instructors can update their modules"
ON public.course_modules
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), course_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), course_id)
);

DROP POLICY IF EXISTS "Admins and instructors can delete their modules" ON public.course_modules;
CREATE POLICY "Admins and instructors can delete their modules"
ON public.course_modules
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), course_id)
);

DROP POLICY IF EXISTS "Everyone can view modules for published courses" ON public.course_modules;
CREATE POLICY "Everyone can view modules for published courses"
ON public.course_modules
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.courses c
    WHERE c.id = course_modules.course_id
      AND (
        c.status = 'published'::public.course_status
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.has_course_access(auth.uid(), c.id)
      )
  )
);

-- COURSE LESSONS
DROP POLICY IF EXISTS "Admins and instructors can create lessons" ON public.course_lessons;
CREATE POLICY "Admins and instructors can create lessons"
ON public.course_lessons
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.course_modules m
    WHERE m.id = course_lessons.module_id
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.has_course_access(auth.uid(), m.course_id)
      )
  )
);

DROP POLICY IF EXISTS "Admins and instructors can update their lessons" ON public.course_lessons;
CREATE POLICY "Admins and instructors can update their lessons"
ON public.course_lessons
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.course_modules m
    WHERE m.id = course_lessons.module_id
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.has_course_access(auth.uid(), m.course_id)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.course_modules m
    WHERE m.id = course_lessons.module_id
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.has_course_access(auth.uid(), m.course_id)
      )
  )
);

DROP POLICY IF EXISTS "Admins and instructors can delete their lessons" ON public.course_lessons;
CREATE POLICY "Admins and instructors can delete their lessons"
ON public.course_lessons
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.course_modules m
    WHERE m.id = course_lessons.module_id
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.has_course_access(auth.uid(), m.course_id)
      )
  )
);

DROP POLICY IF EXISTS "Everyone can view lessons for published courses" ON public.course_lessons;
CREATE POLICY "Everyone can view lessons for published courses"
ON public.course_lessons
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.course_modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = course_lessons.module_id
      AND (
        c.status = 'published'::public.course_status
        OR public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.has_course_access(auth.uid(), c.id)
      )
  )
);

-- CERTIFICATE REQUESTS (for instructor certificate pages)
DROP POLICY IF EXISTS "Admins can view all certificate requests" ON public.certificate_requests;
CREATE POLICY "Admins can view all certificate requests"
ON public.certificate_requests
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR auth.uid() = student_id
  OR public.has_course_access(auth.uid(), course_id)
);

DROP POLICY IF EXISTS "Admins can update certificate requests" ON public.certificate_requests;
CREATE POLICY "Admins can update certificate requests"
ON public.certificate_requests
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), course_id)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_course_access(auth.uid(), course_id)
);