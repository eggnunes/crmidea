-- Create table for tracking email opens
CREATE TABLE IF NOT EXISTS public.email_opens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_email TEXT NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_address TEXT
);

-- Enable RLS
ALTER TABLE public.email_opens ENABLE ROW LEVEL SECURITY;

-- Public policy for the tracking pixel (needs to be public to work)
CREATE POLICY "Allow public insert for email tracking" 
ON public.email_opens 
FOR INSERT 
WITH CHECK (true);

-- Allow users to view their own opens
CREATE POLICY "Users can view opens from their campaigns" 
ON public.email_opens 
FOR SELECT 
USING (
  campaign_id IN (
    SELECT id FROM public.campaigns WHERE user_id = auth.uid()
  )
);

-- Add index for faster lookups
CREATE INDEX idx_email_opens_campaign_id ON public.email_opens(campaign_id);
CREATE INDEX idx_email_opens_lead_email ON public.email_opens(lead_email);