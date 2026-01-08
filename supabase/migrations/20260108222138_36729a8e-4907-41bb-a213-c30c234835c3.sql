-- Create a table for lead tags to allow multiple tags per lead
CREATE TABLE public.lead_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lead_id, tag)
);

-- Enable RLS
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage lead tags
CREATE POLICY "Authenticated users can view lead tags"
ON public.lead_tags
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert lead tags"
ON public.lead_tags
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete lead tags"
ON public.lead_tags
FOR DELETE
TO authenticated
USING (true);

-- Create a storage bucket for ebooks
INSERT INTO storage.buckets (id, name, public)
VALUES ('ebooks', 'ebooks', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access to ebooks
CREATE POLICY "Public can read ebooks"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ebooks');

-- Create policy for authenticated users to upload ebooks
CREATE POLICY "Authenticated users can upload ebooks"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ebooks');

CREATE POLICY "Authenticated users can update ebooks"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'ebooks');

CREATE POLICY "Authenticated users can delete ebooks"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'ebooks');

-- Create table for ebook captures (public access for event form)
CREATE TABLE public.ebook_captures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  event_source TEXT DEFAULT 'evento',
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public inserts
ALTER TABLE public.ebook_captures ENABLE ROW LEVEL SECURITY;

-- Allow public inserts for the capture form
CREATE POLICY "Anyone can submit ebook capture"
ON public.ebook_captures
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only authenticated users can view captures
CREATE POLICY "Authenticated users can view ebook captures"
ON public.ebook_captures
FOR SELECT
TO authenticated
USING (true);

-- Index for faster lookups
CREATE INDEX idx_ebook_captures_email ON public.ebook_captures(email);
CREATE INDEX idx_lead_tags_lead_id ON public.lead_tags(lead_id);
CREATE INDEX idx_lead_tags_tag ON public.lead_tags(tag);