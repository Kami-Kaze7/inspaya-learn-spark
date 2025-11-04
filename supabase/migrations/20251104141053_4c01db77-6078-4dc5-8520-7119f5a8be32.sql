-- Drop existing trigger and function for certificate approval
DROP TRIGGER IF EXISTS certificate_request_notification ON certificate_requests;
DROP FUNCTION IF EXISTS notify_admin_certificate_request();

-- Remove approval-related columns from certificate_requests
ALTER TABLE certificate_requests
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS approved_at,
  DROP COLUMN IF EXISTS approved_by,
  DROP COLUMN IF EXISTS rejection_reason;

-- Rename requested_at to awarded_at for clarity
ALTER TABLE certificate_requests
  RENAME COLUMN requested_at TO awarded_at;

-- Drop the certificate_status enum as it's no longer needed
DROP TYPE IF EXISTS certificate_status;

-- Remove certificate notification types from notifications constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('assignment', 'grade'));