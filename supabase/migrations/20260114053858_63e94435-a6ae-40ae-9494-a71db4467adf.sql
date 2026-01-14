-- Add column for storing the Lovable project URL
ALTER TABLE public.consulting_clients 
ADD COLUMN IF NOT EXISTS lovable_project_url TEXT;

-- Add column for tracking last reminder sent date
ALTER TABLE public.consulting_clients 
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP WITH TIME ZONE;