-- Tabela principal de clientes (leads que fecharam contrato)
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  
  -- Dados básicos
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Dados profissionais
  area_atuacao TEXT, -- área de atuação jurídica
  oab_number TEXT,
  escritorio TEXT, -- nome do escritório
  cidade TEXT,
  estado TEXT,
  
  -- Dados do contrato
  product_type TEXT NOT NULL, -- consultoria, mentoria_individual, etc.
  contract_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  contract_end_date DATE,
  contract_value NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'pendente', -- pendente, pago, parcial
  
  -- Perfil do cliente
  objectives TEXT, -- objetivos com a mentoria/consultoria
  challenges TEXT, -- desafios atuais
  ai_knowledge_level TEXT DEFAULT 'iniciante', -- iniciante, intermediario, avancado
  
  -- Campos customizados do formulário (JSONB para flexibilidade)
  form_data JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'ativo', -- ativo, pausado, concluido, cancelado
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sessões/Reuniões com o cliente
CREATE TABLE public.client_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Dados da sessão
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  session_type TEXT DEFAULT 'reuniao', -- reuniao, call, mensagem, entrega
  
  -- Conteúdo
  title TEXT NOT NULL,
  summary TEXT, -- resumo do que foi discutido
  notes TEXT, -- notas detalhadas
  
  -- Temas abordados (para organização por tema)
  topics TEXT[] DEFAULT '{}',
  
  -- Próximos passos definidos
  next_steps TEXT,
  
  -- Status
  status TEXT DEFAULT 'agendada', -- agendada, realizada, cancelada, reagendada
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Checklist de etapas por cliente
CREATE TABLE public.client_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Dados do marco
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Categoria/Fase
  category TEXT, -- onboarding, implementacao, revisao, etc.
  order_index INTEGER DEFAULT 0,
  
  -- Status
  is_completed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Linha do tempo de eventos
CREATE TABLE public.client_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Tipo de evento
  event_type TEXT NOT NULL, -- contrato_assinado, sessao_realizada, milestone_concluido, entrega, observacao, pagamento
  
  -- Dados do evento
  title TEXT NOT NULL,
  description TEXT,
  
  -- Referência opcional a outras tabelas
  reference_id UUID, -- pode apontar para session_id, milestone_id, etc.
  reference_type TEXT, -- session, milestone, etc.
  
  -- Timestamp do evento
  event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Campos customizados do formulário (definição)
CREATE TABLE public.client_form_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Definição do campo
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT DEFAULT 'text', -- text, textarea, select, checkbox, date, number
  field_options JSONB DEFAULT '[]', -- para campos select
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_form_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for client_sessions
CREATE POLICY "Users can view their own sessions" ON public.client_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sessions" ON public.client_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.client_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions" ON public.client_sessions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for client_milestones
CREATE POLICY "Users can view their own milestones" ON public.client_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own milestones" ON public.client_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own milestones" ON public.client_milestones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own milestones" ON public.client_milestones FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for client_timeline
CREATE POLICY "Users can view their own timeline" ON public.client_timeline FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own timeline" ON public.client_timeline FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own timeline" ON public.client_timeline FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for client_form_fields
CREATE POLICY "Users can view their own form fields" ON public.client_form_fields FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own form fields" ON public.client_form_fields FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own form fields" ON public.client_form_fields FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own form fields" ON public.client_form_fields FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_sessions_updated_at BEFORE UPDATE ON public.client_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_milestones_updated_at BEFORE UPDATE ON public.client_milestones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_form_fields_updated_at BEFORE UPDATE ON public.client_form_fields FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();