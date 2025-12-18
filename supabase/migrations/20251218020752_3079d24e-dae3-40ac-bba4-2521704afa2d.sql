-- Tabela para armazenar mapeamentos de colunas favoritos
CREATE TABLE public.column_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  mapping JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.column_mappings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own mappings" 
ON public.column_mappings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mappings" 
ON public.column_mappings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mappings" 
ON public.column_mappings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mappings" 
ON public.column_mappings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_column_mappings_updated_at
BEFORE UPDATE ON public.column_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();