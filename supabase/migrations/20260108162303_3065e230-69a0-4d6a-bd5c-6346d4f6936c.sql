-- Adicionar coluna para armazenar o plano de implementação
ALTER TABLE public.consulting_clients 
ADD COLUMN IF NOT EXISTS implementation_plan JSONB;