-- Table for client badges/achievements
CREATE TABLE public.client_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('progress', 'engagement', 'milestone', 'special')),
  points INTEGER DEFAULT 10,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for badges earned by clients
CREATE TABLE public.client_earned_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.consulting_clients(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.client_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.client_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_earned_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view badges" ON public.client_badges
  FOR SELECT USING (true);

CREATE POLICY "Clients can view own earned badges" ON public.client_earned_badges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consulting_clients cc 
      WHERE cc.id = client_earned_badges.client_id 
      AND (cc.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM client_profiles cp WHERE cp.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "System can insert earned badges" ON public.client_earned_badges
  FOR INSERT WITH CHECK (true);

-- Insert default badges
INSERT INTO public.client_badges (name, description, icon, category, points, requirement_type, requirement_value) VALUES
  ('Primeiro Passo', 'Completou o formulário de diagnóstico', 'clipboard-check', 'milestone', 10, 'diagnostic_complete', 1),
  ('Primeira Reunião', 'Participou da primeira sessão de consultoria', 'video', 'milestone', 20, 'sessions_completed', 1),
  ('Engajado', 'Enviou 3 atualizações de progresso', 'message-circle', 'engagement', 15, 'feedback_count', 3),
  ('Comunicativo', 'Enviou 10 atualizações de progresso', 'messages-square', 'engagement', 30, 'feedback_count', 10),
  ('IA no Dia a Dia', 'Reportou usar IA diariamente', 'brain', 'progress', 25, 'daily_ai_usage', 1),
  ('Implementação Iniciada', 'Reportou implementação em andamento', 'rocket', 'progress', 15, 'implementation_started', 1),
  ('Implementação Concluída', 'Completou a implementação do sistema', 'trophy', 'milestone', 50, 'implementation_complete', 1),
  ('Veterano', 'Está na consultoria há mais de 90 dias', 'star', 'special', 30, 'days_in_consulting', 90),
  ('Maratonista', 'Participou de 5 sessões de consultoria', 'medal', 'milestone', 40, 'sessions_completed', 5),
  ('Super Engajado', 'Acessou o dashboard 30 vezes', 'zap', 'engagement', 25, 'dashboard_access', 30);

-- Add column to track lead conversion
ALTER TABLE public.consulting_clients ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id);
ALTER TABLE public.consulting_clients ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;