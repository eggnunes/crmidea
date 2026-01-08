-- Add separate city and state fields to consulting_clients
ALTER TABLE public.consulting_clients 
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado VARCHAR(2);