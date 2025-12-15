-- Tabela para configurações do assistente de IA
CREATE TABLE public.ai_assistant_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_name text NOT NULL DEFAULT 'IDEA - Inteligência de Dados e Artificial',
  communication_style text NOT NULL DEFAULT 'descontraida', -- formal, normal, descontraida
  behavior_prompt text,
  purpose text NOT NULL DEFAULT 'suporte', -- suporte, vendas, uso_pessoal
  company_name text,
  company_description text,
  website_url text,
  use_emojis boolean NOT NULL DEFAULT true,
  sign_agent_name boolean NOT NULL DEFAULT false,
  restrict_topics boolean NOT NULL DEFAULT true,
  split_long_messages boolean NOT NULL DEFAULT true,
  allow_reminders boolean NOT NULL DEFAULT true,
  smart_training_search boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Tabela para base de conhecimento/treinamentos
CREATE TABLE public.ai_training_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'text', -- text, website, document
  content text NOT NULL,
  file_url text,
  file_name text,
  status text NOT NULL DEFAULT 'pending', -- pending, trained, error
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela para intenções (ações personalizadas)
CREATE TABLE public.ai_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  intent_name text NOT NULL,
  trigger_phrases text[] NOT NULL DEFAULT '{}',
  action_type text NOT NULL DEFAULT 'link', -- link, message, api_call
  action_value text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela para conversas do WhatsApp
CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_phone text NOT NULL,
  contact_name text,
  last_message_at timestamp with time zone,
  unread_count integer NOT NULL DEFAULT 0,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, contact_phone)
);

-- Tabela para mensagens do WhatsApp
CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message_type text NOT NULL DEFAULT 'text', -- text, image, audio, document
  content text NOT NULL,
  is_from_contact boolean NOT NULL DEFAULT false,
  is_ai_response boolean NOT NULL DEFAULT false,
  zapi_message_id text,
  status text NOT NULL DEFAULT 'sent', -- sent, delivered, read, failed
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_assistant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_training_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Policies for ai_assistant_config
CREATE POLICY "Users can view their own config" ON public.ai_assistant_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own config" ON public.ai_assistant_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own config" ON public.ai_assistant_config FOR UPDATE USING (auth.uid() = user_id);

-- Policies for ai_training_documents
CREATE POLICY "Users can view their own documents" ON public.ai_training_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own documents" ON public.ai_training_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON public.ai_training_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON public.ai_training_documents FOR DELETE USING (auth.uid() = user_id);

-- Policies for ai_intents
CREATE POLICY "Users can view their own intents" ON public.ai_intents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own intents" ON public.ai_intents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own intents" ON public.ai_intents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own intents" ON public.ai_intents FOR DELETE USING (auth.uid() = user_id);

-- Policies for whatsapp_conversations
CREATE POLICY "Users can view their own conversations" ON public.whatsapp_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own conversations" ON public.whatsapp_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own conversations" ON public.whatsapp_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own conversations" ON public.whatsapp_conversations FOR DELETE USING (auth.uid() = user_id);

-- Policies for whatsapp_messages
CREATE POLICY "Users can view their own messages" ON public.whatsapp_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own messages" ON public.whatsapp_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own messages" ON public.whatsapp_messages FOR UPDATE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ai_assistant_config_updated_at
  BEFORE UPDATE ON public.ai_assistant_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for training documents (PDFs, etc)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('training-documents', 'training-documents', false, 104857600);

-- Storage policies
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'training-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'training-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'training-documents' AND auth.uid()::text = (storage.foldername(name))[1]);