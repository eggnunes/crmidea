-- Table for client implementation progress feedback
CREATE TABLE public.client_progress_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  implementation_status TEXT NOT NULL CHECK (implementation_status IN ('not_started', 'in_progress', 'completed', 'blocked')),
  ai_usage_frequency TEXT CHECK (ai_usage_frequency IN ('daily', 'weekly', 'rarely', 'not_using')),
  main_challenges TEXT,
  achievements TEXT,
  needs_help BOOLEAN DEFAULT false,
  help_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for consultant notification settings
CREATE TABLE public.consultant_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  monthly_report_enabled BOOLEAN DEFAULT true,
  monthly_report_day INTEGER DEFAULT 1 CHECK (monthly_report_day >= 1 AND monthly_report_day <= 28),
  inactivity_reminder_enabled BOOLEAN DEFAULT true,
  inactivity_reminder_days INTEGER DEFAULT 30,
  booking_email_notification BOOLEAN DEFAULT true,
  diagnostic_email_notification BOOLEAN DEFAULT true,
  consultant_email TEXT DEFAULT 'eggnunes@gmail.com',
  from_email_name TEXT DEFAULT 'Consultoria IDEA',
  from_email_address TEXT DEFAULT 'naoresponda@rafaelegg.com',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_progress_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultant_notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_progress_feedback
CREATE POLICY "Users can view own feedback" ON public.client_progress_feedback
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own feedback" ON public.client_progress_feedback
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Consultants can view client feedback" ON public.client_progress_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consulting_clients cc 
      WHERE cc.id = client_progress_feedback.client_id 
      AND cc.user_id = auth.uid()
    )
  );

-- RLS policies for consultant_notification_settings
CREATE POLICY "Users can manage own settings" ON public.consultant_notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_consultant_notification_settings_updated_at
  BEFORE UPDATE ON public.consultant_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();