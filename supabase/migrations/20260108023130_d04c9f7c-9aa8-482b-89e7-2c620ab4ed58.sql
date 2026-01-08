-- Create storage bucket for consulting logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('consulting-logos', 'consulting-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for consulting logos bucket
CREATE POLICY "Anyone can view consulting logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'consulting-logos');

CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'consulting-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'consulting-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'consulting-logos' AND auth.uid() IS NOT NULL);

-- Create consulting_client_reminders table for follow-up alerts
CREATE TABLE IF NOT EXISTS public.consulting_client_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL DEFAULT 'no_meeting',
  reminder_message TEXT NOT NULL,
  days_since_last_meeting INTEGER,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reminders table
ALTER TABLE public.consulting_client_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for reminders
CREATE POLICY "Users can view their own reminders"
ON public.consulting_client_reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
ON public.consulting_client_reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
ON public.consulting_client_reminders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
ON public.consulting_client_reminders FOR DELETE
USING (auth.uid() = user_id);