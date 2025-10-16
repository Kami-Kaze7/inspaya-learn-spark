-- Add target_audience to announcements table
ALTER TABLE public.announcements 
ADD COLUMN target_audience text NOT NULL DEFAULT 'all',
ADD COLUMN priority text DEFAULT 'medium',
ADD COLUMN expires_at timestamp with time zone;

-- Add index for better query performance
CREATE INDEX idx_announcements_target_audience ON public.announcements(target_audience);
CREATE INDEX idx_announcements_created_at ON public.announcements(created_at DESC);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;

-- Add conversation support with last_message_at for sorting
CREATE INDEX idx_messages_sender_recipient ON public.messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX idx_messages_recipient_sender ON public.messages(recipient_id, sender_id, created_at DESC);