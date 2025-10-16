-- Create table to track announcement views
CREATE TABLE public.announcement_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

-- Enable RLS
ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own announcement views
CREATE POLICY "Users can view their own announcement views"
ON public.announcement_views
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own announcement views
CREATE POLICY "Users can insert their own announcement views"
ON public.announcement_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_announcement_views_user_id ON public.announcement_views(user_id);
CREATE INDEX idx_announcement_views_announcement_id ON public.announcement_views(announcement_id);