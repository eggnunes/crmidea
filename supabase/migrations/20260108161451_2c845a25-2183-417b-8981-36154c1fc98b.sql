-- Tabela para armazenar documentos e links dos clientes da consultoria
CREATE TABLE public.consulting_client_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  document_type VARCHAR(50) NOT NULL DEFAULT 'link', -- 'link', 'file', 'video'
  file_url TEXT,
  external_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consulting_client_documents ENABLE ROW LEVEL SECURITY;

-- Políticas para consultores (administradores)
CREATE POLICY "Consultores podem ver documentos de seus clientes"
ON public.consulting_client_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.consulting_clients cc 
    WHERE cc.id = client_id AND cc.user_id = auth.uid()
  )
);

CREATE POLICY "Consultores podem inserir documentos para seus clientes"
ON public.consulting_client_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.consulting_clients cc 
    WHERE cc.id = client_id AND cc.user_id = auth.uid()
  )
);

CREATE POLICY "Consultores podem atualizar documentos de seus clientes"
ON public.consulting_client_documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.consulting_clients cc 
    WHERE cc.id = client_id AND cc.user_id = auth.uid()
  )
);

CREATE POLICY "Consultores podem deletar documentos de seus clientes"
ON public.consulting_client_documents
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.consulting_clients cc 
    WHERE cc.id = client_id AND cc.user_id = auth.uid()
  )
);

-- Políticas para clientes (visualização apenas)
CREATE POLICY "Clientes podem ver seus próprios documentos"
ON public.consulting_client_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.consulting_clients cc
    JOIN public.client_profiles cp ON cp.email = cc.email
    WHERE cc.id = client_id AND cp.user_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_consulting_client_documents_updated_at
BEFORE UPDATE ON public.consulting_client_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para documentos da consultoria
INSERT INTO storage.buckets (id, name, public) VALUES ('consulting-documents', 'consulting-documents', false);

-- Políticas de storage
CREATE POLICY "Consultores podem fazer upload de documentos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'consulting-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Consultores podem ver seus documentos"
ON storage.objects FOR SELECT
USING (bucket_id = 'consulting-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Consultores podem deletar seus documentos"
ON storage.objects FOR DELETE
USING (bucket_id = 'consulting-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Tabela para configurações da consultoria (incluindo link do calendário)
CREATE TABLE IF NOT EXISTS public.consulting_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  calendar_booking_url TEXT,
  whatsapp_notifications_enabled BOOLEAN DEFAULT true,
  email_notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consulting_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias configurações"
ON public.consulting_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias configurações"
ON public.consulting_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias configurações"
ON public.consulting_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_consulting_settings_updated_at
BEFORE UPDATE ON public.consulting_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();