ALTER TABLE public.consulting_clients 
ADD COLUMN IF NOT EXISTS meet_display_name text DEFAULT NULL;

COMMENT ON COLUMN public.consulting_clients.meet_display_name IS 'Nome alternativo que aparece nas gravações do Google Meet (ex: nome do sócio que agendou a reunião)';
