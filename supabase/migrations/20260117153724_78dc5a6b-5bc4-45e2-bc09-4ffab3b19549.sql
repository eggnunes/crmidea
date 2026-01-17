-- Add column to disable AI per conversation
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN ai_disabled boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.whatsapp_conversations.ai_disabled IS 'When true, AI will not respond to messages in this conversation';