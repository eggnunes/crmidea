-- Add column to store fragmented prompts (etapas) for consulting clients
ALTER TABLE public.consulting_clients
ADD COLUMN IF NOT EXISTS fragmented_prompts JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN public.consulting_clients.fragmented_prompts IS 'Array of implementation steps with prompts organized by priority and category';