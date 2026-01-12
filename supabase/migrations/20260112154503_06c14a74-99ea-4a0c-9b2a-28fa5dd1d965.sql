-- Create table for alert settings
CREATE TABLE IF NOT EXISTS public.appstore_alert_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  email_address TEXT,
  min_rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, alert_type)
);

-- Create table for review responses
CREATE TABLE IF NOT EXISTS public.appstore_review_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES public.appstore_reviews(id) ON DELETE CASCADE,
  apple_review_id TEXT,
  response_text TEXT NOT NULL,
  response_status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for sent alerts log
CREATE TABLE IF NOT EXISTS public.appstore_alerts_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  reference_id TEXT,
  email_sent_to TEXT,
  message TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appstore_alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appstore_review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appstore_alerts_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appstore_alert_settings
CREATE POLICY "Admins can manage alert settings"
ON public.appstore_alert_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- RLS Policies for appstore_review_responses
CREATE POLICY "Admins can manage review responses"
ON public.appstore_review_responses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- RLS Policies for appstore_alerts_log
CREATE POLICY "Admins can view alerts log"
ON public.appstore_alerts_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appstore_alert_settings_user ON public.appstore_alert_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_appstore_review_responses_review ON public.appstore_review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_appstore_alerts_log_created ON public.appstore_alerts_log(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_appstore_alert_settings_updated_at
BEFORE UPDATE ON public.appstore_alert_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_appstore_review_responses_updated_at
BEFORE UPDATE ON public.appstore_review_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();