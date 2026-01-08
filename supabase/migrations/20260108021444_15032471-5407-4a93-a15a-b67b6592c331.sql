-- Add separate address fields to consulting_clients
ALTER TABLE public.consulting_clients 
ADD COLUMN IF NOT EXISTS address_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);