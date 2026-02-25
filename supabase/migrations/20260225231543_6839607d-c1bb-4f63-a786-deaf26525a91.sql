
-- Add last_active_at column to client_profiles
ALTER TABLE public.client_profiles 
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Initialize with updated_at
UPDATE public.client_profiles SET last_active_at = updated_at WHERE last_active_at IS NULL;

-- Add RLS policy for consulting_settings so clients can read their consultant's settings
CREATE POLICY "Clientes podem ver settings do seu consultor"
ON public.consulting_settings FOR SELECT TO authenticated
USING (
  user_id IN (
    SELECT consultant_id FROM public.client_profiles WHERE user_id = auth.uid()
  )
);
