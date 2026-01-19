-- Sistema de Campanhas: Tabelas para gerenciamento de campanhas de email e WhatsApp

-- Tabela principal de campanhas
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('email', 'whatsapp')),
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'agendada', 'em_andamento', 'pausada', 'concluida', 'cancelada')),
  subject TEXT, -- Para campanhas de email
  content TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de filtros da campanha (quem vai receber)
CREATE TABLE public.campaign_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  filter_type TEXT NOT NULL CHECK (filter_type IN ('tag', 'product', 'status', 'source', 'all')),
  filter_value TEXT, -- NULL para 'all'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de destinatários da campanha
CREATE TABLE public.campaign_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'falhou', 'aberto', 'clicado')),
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, lead_id)
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Policies para campaigns
CREATE POLICY "Users can view their own campaigns"
  ON public.campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON public.campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para campaign_filters
CREATE POLICY "Users can view filters of their campaigns"
  ON public.campaign_filters FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_filters.campaign_id 
    AND campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can create filters for their campaigns"
  ON public.campaign_filters FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_filters.campaign_id 
    AND campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete filters from their campaigns"
  ON public.campaign_filters FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_filters.campaign_id 
    AND campaigns.user_id = auth.uid()
  ));

-- Policies para campaign_recipients
CREATE POLICY "Users can view recipients of their campaigns"
  ON public.campaign_recipients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_recipients.campaign_id 
    AND campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can add recipients to their campaigns"
  ON public.campaign_recipients FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_recipients.campaign_id 
    AND campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can update recipients in their campaigns"
  ON public.campaign_recipients FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_recipients.campaign_id 
    AND campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete recipients from their campaigns"
  ON public.campaign_recipients FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_recipients.campaign_id 
    AND campaigns.user_id = auth.uid()
  ));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_recipients_updated_at
  BEFORE UPDATE ON public.campaign_recipients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();