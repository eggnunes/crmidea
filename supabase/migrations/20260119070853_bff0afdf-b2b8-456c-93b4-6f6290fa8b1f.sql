-- Create scheduled campaign emails table
CREATE TABLE IF NOT EXISTS public.scheduled_campaign_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  cta_text TEXT,
  cta_url TEXT NOT NULL DEFAULT 'https://www.rafaelegg.com/consultoria',
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL DEFAULT '11:30:00',
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  recipients_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_campaign_emails ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON public.scheduled_campaign_emails
  FOR ALL USING (true);

-- Create index for scheduling
CREATE INDEX idx_scheduled_emails_date_status ON public.scheduled_campaign_emails(scheduled_date, status);

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_emails_updated_at
  BEFORE UPDATE ON public.scheduled_campaign_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();