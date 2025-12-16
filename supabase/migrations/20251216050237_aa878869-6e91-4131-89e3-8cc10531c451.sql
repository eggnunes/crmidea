-- Add manychat_subscriber_id to whatsapp_conversations table
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN manychat_subscriber_id text;