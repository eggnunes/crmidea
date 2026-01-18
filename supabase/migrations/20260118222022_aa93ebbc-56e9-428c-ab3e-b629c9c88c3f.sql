-- Add audio_url column to whatsapp_messages table for storing audio file URLs
ALTER TABLE public.whatsapp_messages ADD COLUMN IF NOT EXISTS audio_url text;

-- Add index for faster queries on audio messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_audio_url ON public.whatsapp_messages (audio_url) WHERE audio_url IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.whatsapp_messages.audio_url IS 'URL of the audio file stored in Supabase Storage for audio messages';