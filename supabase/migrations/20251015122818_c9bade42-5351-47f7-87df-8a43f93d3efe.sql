-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'student', 'instructor');

-- Create enum for course status
CREATE TYPE public.course_status AS ENUM ('draft', 'published', 'archived');

-- Create enum for enrollment status
CREATE TYPE public.enrollment_status AS ENUM ('active', 'completed', 'dropped');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status course_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  status enrollment_status DEFAULT 'active',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (student_id, course_id)
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for courses
CREATE POLICY "Everyone can view published courses" ON public.courses FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(), 'admin') OR auth.uid() = instructor_id);
CREATE POLICY "Admins and instructors can create courses" ON public.courses FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'instructor'));
CREATE POLICY "Admins and course instructors can update courses" ON public.courses FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = instructor_id);
CREATE POLICY "Admins can delete courses" ON public.courses FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for enrollments
CREATE POLICY "Students can view their enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can enroll in courses" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Admins can manage all enrollments" ON public.enrollments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for announcements
CREATE POLICY "Everyone can view announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins can create announcements" ON public.announcements FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update announcements" ON public.announcements FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for messages
CREATE POLICY "Users can view their messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their received messages" ON public.messages FOR UPDATE USING (auth.uid() = recipient_id);

-- RLS Policies for assignments
CREATE POLICY "Students can view assignments for enrolled courses" ON public.assignments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE student_id = auth.uid() AND course_id = assignments.course_id
  ) OR public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = assignments.course_id AND instructor_id = auth.uid()
  )
);
CREATE POLICY "Instructors can create assignments for their courses" ON public.assignments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = course_id AND instructor_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Instructors can update their assignments" ON public.assignments FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE id = assignments.course_id AND instructor_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins can delete assignments" ON public.assignments FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();