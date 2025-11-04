-- Create notifications table for assignment and grade notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('assignment', 'grade')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  link TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notifications for new assignments
CREATE OR REPLACE FUNCTION create_assignment_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_record RECORD;
  course_title TEXT;
BEGIN
  -- Get course title
  SELECT title INTO course_title
  FROM courses
  WHERE id = NEW.course_id;

  -- Create notification for each enrolled student
  FOR student_record IN
    SELECT student_id
    FROM enrollments
    WHERE course_id = NEW.course_id
      AND status = 'active'
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_id,
      link
    ) VALUES (
      student_record.student_id,
      'assignment',
      'New Assignment Posted',
      'New assignment "' || NEW.title || '" in ' || COALESCE(course_title, 'your course'),
      NEW.id,
      '/student/assignments'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for assignment notifications
CREATE TRIGGER assignment_created_notification
  AFTER INSERT ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION create_assignment_notifications();

-- Function to create notifications for graded submissions
CREATE OR REPLACE FUNCTION create_grade_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assignment_title TEXT;
BEGIN
  -- Only trigger if grade changed from NULL to a value
  IF OLD.grade IS NULL AND NEW.grade IS NOT NULL THEN
    -- Get assignment title
    SELECT title INTO assignment_title
    FROM assignments
    WHERE id = NEW.assignment_id;

    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_id,
      link
    ) VALUES (
      NEW.student_id,
      'grade',
      'Assignment Graded',
      'Your submission for "' || COALESCE(assignment_title, 'assignment') || '" has been graded: ' || NEW.grade || '/100',
      NEW.id,
      '/student/assignments'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for grade notifications
CREATE TRIGGER submission_graded_notification
  AFTER UPDATE ON assignment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION create_grade_notifications();