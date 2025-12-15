
-- Add AI enabled flag per channel
ALTER TABLE public.channel_configs 
ADD COLUMN ai_enabled boolean NOT NULL DEFAULT true;

-- Create view for channel analytics (optional helper)
-- We'll query this data directly in the app
