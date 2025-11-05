-- Enable realtime for submission tables (other tables already configured)
ALTER TABLE assignment_submissions REPLICA IDENTITY FULL;
ALTER TABLE project_submissions REPLICA IDENTITY FULL;

-- Add submission tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE assignment_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE project_submissions;