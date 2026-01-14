-- Create storage bucket for implementation screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('implementation-screenshots', 'implementation-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy to allow authenticated users to upload screenshots
CREATE POLICY "Authenticated users can upload implementation screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'implementation-screenshots' 
  AND auth.role() = 'authenticated'
);

-- Create RLS policy to allow public read access
CREATE POLICY "Public can view implementation screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'implementation-screenshots');

-- Create RLS policy to allow users to delete their own screenshots
CREATE POLICY "Users can delete their own implementation screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'implementation-screenshots' 
  AND auth.role() = 'authenticated'
);