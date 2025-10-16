-- Add 'pending' status to enrollment_status enum
ALTER TYPE enrollment_status ADD VALUE IF NOT EXISTS 'pending';

-- Add payment_verified column to track admin approval
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS payment_verified boolean DEFAULT false;

-- Update RLS policy to allow pending enrollments without payment verification
DROP POLICY IF EXISTS "Students can enroll in courses" ON enrollments;
CREATE POLICY "Students can enroll in courses"
ON enrollments
FOR INSERT
WITH CHECK (auth.uid() = student_id);