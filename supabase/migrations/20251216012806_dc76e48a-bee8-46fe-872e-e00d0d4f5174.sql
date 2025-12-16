-- Create table for conversation assignees
CREATE TABLE IF NOT EXISTS public.conversation_assignees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    assigned_by UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (conversation_id, user_id)
);

-- Enable RLS
ALTER TABLE public.conversation_assignees ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view assignees for their conversations" 
ON public.conversation_assignees 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.whatsapp_conversations wc 
        WHERE wc.id = conversation_id AND wc.user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage assignees for their conversations" 
ON public.conversation_assignees 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.whatsapp_conversations wc 
        WHERE wc.id = conversation_id AND wc.user_id = auth.uid()
    )
);

-- Add sent_by_user_id to messages to track who sent each message
ALTER TABLE public.whatsapp_messages 
ADD COLUMN IF NOT EXISTS sent_by_user_id UUID,
ADD COLUMN IF NOT EXISTS sent_by_user_name TEXT;