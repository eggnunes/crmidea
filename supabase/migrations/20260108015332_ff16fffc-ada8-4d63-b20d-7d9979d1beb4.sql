-- Create client profiles table for consulting clients (separate from CRM users)
CREATE TABLE public.client_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  office_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table to store form progress (auto-save)
CREATE TABLE public.diagnostic_form_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 1,
  form_data JSONB NOT NULL DEFAULT '{}',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_user_id)
);

-- Create table for client meeting notes (atas de reunião)
CREATE TABLE public.client_meeting_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  notes TEXT,
  next_steps TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for client timeline events
CREATE TABLE public.client_timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_form_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_timeline_events ENABLE ROW LEVEL SECURITY;

-- Policies for client_profiles
CREATE POLICY "Clients can view their own profile"
ON public.client_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Clients can update their own profile"
ON public.client_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view their clients profiles"
ON public.client_profiles FOR SELECT
USING (auth.uid() = consultant_id);

CREATE POLICY "Consultants can manage their clients profiles"
ON public.client_profiles FOR ALL
USING (auth.uid() = consultant_id);

CREATE POLICY "Anyone can create client profile on signup"
ON public.client_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policies for diagnostic_form_progress
CREATE POLICY "Clients can manage their own form progress"
ON public.diagnostic_form_progress FOR ALL
USING (auth.uid() = client_user_id);

CREATE POLICY "Consultants can view their clients form progress"
ON public.diagnostic_form_progress FOR SELECT
USING (auth.uid() = consultant_id);

-- Policies for client_meeting_notes
CREATE POLICY "Clients can view their meeting notes"
ON public.client_meeting_notes FOR SELECT
USING (auth.uid() = client_user_id);

CREATE POLICY "Consultants can manage their clients meeting notes"
ON public.client_meeting_notes FOR ALL
USING (auth.uid() = consultant_id);

-- Policies for client_timeline_events
CREATE POLICY "Clients can view their timeline events"
ON public.client_timeline_events FOR SELECT
USING (auth.uid() = client_user_id);

CREATE POLICY "Consultants can manage their clients timeline events"
ON public.client_timeline_events FOR ALL
USING (auth.uid() = consultant_id);

-- Create triggers for updated_at
CREATE TRIGGER update_client_profiles_updated_at
BEFORE UPDATE ON public.client_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diagnostic_form_progress_updated_at
BEFORE UPDATE ON public.diagnostic_form_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_meeting_notes_updated_at
BEFORE UPDATE ON public.client_meeting_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();