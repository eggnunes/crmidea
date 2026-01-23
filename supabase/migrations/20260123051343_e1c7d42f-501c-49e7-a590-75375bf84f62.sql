-- Add calendar.app booking URL to booking page settings
ALTER TABLE public.booking_page_settings
ADD COLUMN IF NOT EXISTS calendar_app_url text;

-- Optional: index for quick lookup per user
CREATE INDEX IF NOT EXISTS idx_booking_page_settings_user_id
ON public.booking_page_settings (user_id);
