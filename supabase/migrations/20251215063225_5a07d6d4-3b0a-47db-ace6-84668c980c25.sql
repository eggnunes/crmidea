-- Add new columns to ai_assistant_config for advanced features
ALTER TABLE public.ai_assistant_config
ADD COLUMN IF NOT EXISTS inactivity_timeout_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS inactivity_action TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS inactivity_message TEXT,
ADD COLUMN IF NOT EXISTS elevenlabs_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS elevenlabs_voice_id TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT,
ADD COLUMN IF NOT EXISTS show_typing_indicator BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_recording_indicator BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS response_delay_seconds INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS disable_group_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_create_contacts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS voice_response_enabled BOOLEAN DEFAULT false;

-- Create contact_tags table
CREATE TABLE public.contact_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tags" ON public.contact_tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tags" ON public.contact_tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tags" ON public.contact_tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tags" ON public.contact_tags FOR DELETE USING (auth.uid() = user_id);

-- Create whatsapp_contacts table for contact management
CREATE TABLE public.whatsapp_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone TEXT NOT NULL,
  name TEXT,
  notes TEXT,
  bot_disabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, phone)
);

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contacts" ON public.whatsapp_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contacts" ON public.whatsapp_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contacts" ON public.whatsapp_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contacts" ON public.whatsapp_contacts FOR DELETE USING (auth.uid() = user_id);

-- Create junction table for contacts and tags
CREATE TABLE public.whatsapp_contact_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.contact_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id, tag_id)
);

ALTER TABLE public.whatsapp_contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage contact tags via contacts" ON public.whatsapp_contact_tags 
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.whatsapp_contacts WHERE id = contact_id AND user_id = auth.uid())
);

-- Create scheduled_messages table
CREATE TABLE public.scheduled_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scheduled messages" ON public.scheduled_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own scheduled messages" ON public.scheduled_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own scheduled messages" ON public.scheduled_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own scheduled messages" ON public.scheduled_messages FOR DELETE USING (auth.uid() = user_id);

-- Create quick_responses table
CREATE TABLE public.quick_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shortcut TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, shortcut)
);

ALTER TABLE public.quick_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quick responses" ON public.quick_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quick responses" ON public.quick_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quick responses" ON public.quick_responses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quick responses" ON public.quick_responses FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_whatsapp_contacts_updated_at
BEFORE UPDATE ON public.whatsapp_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quick_responses_updated_at
BEFORE UPDATE ON public.quick_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();