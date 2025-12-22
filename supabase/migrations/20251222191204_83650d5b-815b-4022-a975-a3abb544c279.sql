-- Create a public bucket for AI audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-audio', 'ai-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read audio files (public bucket)
CREATE POLICY "Public audio access"
ON storage.objects FOR SELECT
USING (bucket_id = 'ai-audio');

-- Allow authenticated users to upload audio files
CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ai-audio' AND auth.role() = 'authenticated');

-- Allow service role to upload (for edge functions)
CREATE POLICY "Service role can upload audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ai-audio');