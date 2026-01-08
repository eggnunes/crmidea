-- Add bairro field to consulting_clients
ALTER TABLE public.consulting_clients 
ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);