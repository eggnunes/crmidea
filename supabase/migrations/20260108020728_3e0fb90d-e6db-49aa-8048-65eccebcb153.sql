-- Add CPF/CNPJ and OAB columns to consulting_clients table
ALTER TABLE public.consulting_clients
ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT,
ADD COLUMN IF NOT EXISTS oab_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.consulting_clients.cpf_cnpj IS 'CPF or CNPJ of the responsible person or office';
COMMENT ON COLUMN public.consulting_clients.oab_number IS 'OAB registration number in format XXXXXX/UF';