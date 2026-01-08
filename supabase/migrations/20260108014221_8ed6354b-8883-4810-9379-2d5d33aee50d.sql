-- Create storage bucket for consulting client logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('consulting-logos', 'consulting-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to logos
CREATE POLICY "Public can view consulting logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'consulting-logos');

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload consulting logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'consulting-logos');

-- Allow users to update their own logos
CREATE POLICY "Users can update consulting logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'consulting-logos');

-- Allow users to delete logos
CREATE POLICY "Users can delete consulting logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'consulting-logos');