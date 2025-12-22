-- Add LID fields to whatsapp_conversations table
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN IF NOT EXISTS contact_lid TEXT;

-- Add index for faster lookups by LID
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_contact_lid 
ON public.whatsapp_conversations(contact_lid);

-- Add LID field to whatsapp_contacts table
ALTER TABLE public.whatsapp_contacts 
ADD COLUMN IF NOT EXISTS lid TEXT;

-- Add index for faster lookups by LID
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_lid 
ON public.whatsapp_contacts(lid);

-- Add comment explaining the LID field
COMMENT ON COLUMN public.whatsapp_conversations.contact_lid IS 'WhatsApp LID - unique private identifier that replaces phone number in newer API versions';
COMMENT ON COLUMN public.whatsapp_contacts.lid IS 'WhatsApp LID - unique private identifier that replaces phone number in newer API versions';