-- Tabela para clientes de consultoria
CREATE TABLE public.consulting_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Informações Básicas
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  office_name TEXT NOT NULL,
  office_address TEXT NOT NULL,
  foundation_year INTEGER,
  website TEXT,
  num_lawyers INTEGER NOT NULL DEFAULT 1,
  num_employees INTEGER NOT NULL DEFAULT 1,
  practice_areas TEXT,
  
  -- Conhecimento em IA
  has_used_ai BOOLEAN DEFAULT false,
  ai_tools_used TEXT,
  has_used_chatgpt BOOLEAN DEFAULT false,
  has_chatgpt_app BOOLEAN DEFAULT false,
  has_chatgpt_paid BOOLEAN DEFAULT false,
  ai_familiarity_level TEXT DEFAULT 'beginner',
  ai_usage_frequency TEXT DEFAULT 'never',
  ai_tasks_used TEXT,
  ai_difficulties TEXT,
  
  -- Expectativas e Motivações
  tasks_to_automate TEXT,
  other_ai_tools TEXT,
  expected_results TEXT[],
  expected_results_other TEXT,
  comfortable_with_tech BOOLEAN DEFAULT true,
  motivations TEXT[],
  motivations_other TEXT,
  
  -- Processos e Fluxos
  case_management_system TEXT,
  case_management_other TEXT,
  client_service_flow TEXT,
  case_management_flow TEXT,
  
  -- Logo
  logo_url TEXT,
  
  -- Funcionalidades selecionadas
  selected_features INTEGER[] DEFAULT '{}',
  custom_features TEXT,
  
  -- Prompt gerado
  generated_prompt TEXT,
  
  -- Status do cliente
  status TEXT DEFAULT 'pending',
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para reuniões/sessões de consultoria
CREATE TABLE public.consulting_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  session_type TEXT DEFAULT 'online',
  status TEXT DEFAULT 'scheduled',
  
  -- Ata da reunião
  notes TEXT,
  summary TEXT,
  next_steps TEXT,
  topics TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.consulting_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for consulting_clients
CREATE POLICY "Users can view their own consulting clients" 
ON public.consulting_clients FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consulting clients" 
ON public.consulting_clients FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consulting clients" 
ON public.consulting_clients FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consulting clients" 
ON public.consulting_clients FOR DELETE USING (auth.uid() = user_id);

-- Policies for consulting_sessions
CREATE POLICY "Users can view their own consulting sessions" 
ON public.consulting_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consulting sessions" 
ON public.consulting_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consulting sessions" 
ON public.consulting_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consulting sessions" 
ON public.consulting_sessions FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updating updated_at
CREATE TRIGGER update_consulting_clients_updated_at
  BEFORE UPDATE ON public.consulting_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consulting_sessions_updated_at
  BEFORE UPDATE ON public.consulting_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();