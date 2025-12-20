-- Create table for booking page settings
CREATE TABLE public.booking_page_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Agende sua Sessão',
  description TEXT DEFAULT 'Selecione um horário disponível para nossa mentoria. Estou ansioso para ajudá-lo em sua jornada!',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.booking_page_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own booking settings"
  ON public.booking_page_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own booking settings"
  ON public.booking_page_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own booking settings"
  ON public.booking_page_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Public read access for the booking page (needs to work without auth)
CREATE POLICY "Public can read booking settings"
  ON public.booking_page_settings
  FOR SELECT
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_booking_page_settings_updated_at
  BEFORE UPDATE ON public.booking_page_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();