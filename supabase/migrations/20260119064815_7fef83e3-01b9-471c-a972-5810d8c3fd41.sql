-- Create table to track unsubscribed emails
CREATE TABLE public.email_unsubscribes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  unsubscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT,
  campaign_id UUID REFERENCES public.campaigns(id),
  ip_address TEXT,
  user_agent TEXT
);

-- Create unique index on email to prevent duplicates
CREATE UNIQUE INDEX idx_email_unsubscribes_email ON public.email_unsubscribes(LOWER(email));

-- Create index for faster lookups
CREATE INDEX idx_email_unsubscribes_date ON public.email_unsubscribes(unsubscribed_at);

-- Enable RLS
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Policy for reading unsubscribes (authenticated users)
CREATE POLICY "Authenticated users can view unsubscribes"
ON public.email_unsubscribes
FOR SELECT
TO authenticated
USING (true);

-- Policy for inserting unsubscribes (anyone can unsubscribe via edge function)
CREATE POLICY "Anyone can insert unsubscribes"
ON public.email_unsubscribes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);