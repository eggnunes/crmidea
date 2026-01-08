-- Create table to track bio link clicks
CREATE TABLE public.bio_link_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_title TEXT NOT NULL,
  link_url TEXT NOT NULL,
  category TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  referrer TEXT
);

-- Enable RLS
ALTER TABLE public.bio_link_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert clicks (public page)
CREATE POLICY "Anyone can insert clicks"
  ON public.bio_link_clicks
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only authenticated users can view clicks (admin only)
CREATE POLICY "Authenticated users can view clicks"
  ON public.bio_link_clicks
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index for better performance on analytics queries
CREATE INDEX idx_bio_link_clicks_link_title ON public.bio_link_clicks(link_title);
CREATE INDEX idx_bio_link_clicks_clicked_at ON public.bio_link_clicks(clicked_at);