
-- Create enum for communication channels
CREATE TYPE public.channel_type AS ENUM ('whatsapp', 'instagram', 'facebook', 'tiktok', 'email', 'telegram');

-- Add channel column to whatsapp_conversations (defaulting to whatsapp for existing records)
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN channel channel_type NOT NULL DEFAULT 'whatsapp';

-- Add channel-specific identifier columns
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN channel_user_id text,
ADD COLUMN channel_page_id text,
ADD COLUMN profile_picture_url text;

-- Add channel column to whatsapp_messages
ALTER TABLE public.whatsapp_messages 
ADD COLUMN channel channel_type NOT NULL DEFAULT 'whatsapp';

-- Add channel-specific message ID column (for Instagram, Facebook, etc.)
ALTER TABLE public.whatsapp_messages 
ADD COLUMN channel_message_id text;

-- Create table for channel configurations (API credentials per channel)
CREATE TABLE public.channel_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel channel_type NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}',
  access_token text,
  page_id text,
  webhook_verify_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel)
);

-- Enable RLS on channel_configs
ALTER TABLE public.channel_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies for channel_configs
CREATE POLICY "Users can view their own channel configs"
ON public.channel_configs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own channel configs"
ON public.channel_configs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own channel configs"
ON public.channel_configs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own channel configs"
ON public.channel_configs FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_conversations_channel ON public.whatsapp_conversations(channel);
CREATE INDEX idx_messages_channel ON public.whatsapp_messages(channel);
CREATE INDEX idx_channel_configs_user_channel ON public.channel_configs(user_id, channel);

-- Add trigger for updated_at on channel_configs
CREATE TRIGGER update_channel_configs_updated_at
BEFORE UPDATE ON public.channel_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
