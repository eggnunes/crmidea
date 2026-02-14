
-- Add columns for Meet recording sync, transcription, and AI summary
ALTER TABLE public.consulting_sessions
  ADD COLUMN IF NOT EXISTS recording_url text,
  ADD COLUMN IF NOT EXISTS recording_drive_id text,
  ADD COLUMN IF NOT EXISTS transcription text,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS summary_generated_at timestamptz;
