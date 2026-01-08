-- Create table to log all emails sent to clients
CREATE TABLE public.sent_emails_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sent_emails_log ENABLE ROW LEVEL SECURITY;

-- Policies for sent_emails_log
CREATE POLICY "Users can view their own sent emails"
  ON public.sent_emails_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sent emails"
  ON public.sent_emails_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_sent_emails_user_id ON public.sent_emails_log(user_id);
CREATE INDEX idx_sent_emails_created_at ON public.sent_emails_log(created_at DESC);