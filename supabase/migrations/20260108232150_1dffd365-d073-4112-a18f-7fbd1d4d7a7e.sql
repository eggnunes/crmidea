
-- Add approval status to client_profiles
ALTER TABLE public.client_profiles 
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS approved_by uuid DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_client_profiles_is_approved ON public.client_profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_client_profiles_consultant_id ON public.client_profiles(consultant_id);
