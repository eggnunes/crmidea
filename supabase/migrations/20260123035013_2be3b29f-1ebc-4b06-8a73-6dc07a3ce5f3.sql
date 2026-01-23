-- Add Google Calendar linkage fields to consulting sessions
ALTER TABLE public.consulting_sessions
ADD COLUMN IF NOT EXISTS google_event_id text,
ADD COLUMN IF NOT EXISTS google_event_link text,
ADD COLUMN IF NOT EXISTS google_calendar_id text;

CREATE INDEX IF NOT EXISTS idx_consulting_sessions_google_event_id
ON public.consulting_sessions (google_event_id);
