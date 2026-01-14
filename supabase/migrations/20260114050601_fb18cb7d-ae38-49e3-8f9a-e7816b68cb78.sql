-- Add feature_priorities column to consulting_clients table
-- This stores the priority for each selected feature as a JSONB object
-- Format: { "feature_id": "alta" | "media" | "baixa" }
ALTER TABLE public.consulting_clients
ADD COLUMN feature_priorities JSONB DEFAULT '{}'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN public.consulting_clients.feature_priorities IS 'Stores priority level (alta, media, baixa) for each selected feature by feature_id';