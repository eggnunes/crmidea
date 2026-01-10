-- Add is_visible_to_client column to client_timeline_events table
ALTER TABLE public.client_timeline_events 
ADD COLUMN is_visible_to_client boolean NOT NULL DEFAULT true;

-- Add a comment to explain the column
COMMENT ON COLUMN public.client_timeline_events.is_visible_to_client IS 'Whether this event is visible to the client or only to the consultant/admin';