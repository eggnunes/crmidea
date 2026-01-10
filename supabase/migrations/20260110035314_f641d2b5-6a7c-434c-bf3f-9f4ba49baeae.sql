-- Create storage bucket for consulting files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('consulting-files', 'consulting-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous users to upload files (for the diagnostic form)
CREATE POLICY "Allow anonymous upload for diagnostic form"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'consulting-files' AND position('diagnostic-attachments/' in name) = 1);

-- Allow anyone to view files in the bucket
CREATE POLICY "Allow public read for consulting files"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'consulting-files');

-- Allow authenticated users to upload and manage their files
CREATE POLICY "Authenticated users can upload consulting files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'consulting-files');

CREATE POLICY "Authenticated users can update their consulting files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'consulting-files');

CREATE POLICY "Authenticated users can delete their consulting files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'consulting-files');