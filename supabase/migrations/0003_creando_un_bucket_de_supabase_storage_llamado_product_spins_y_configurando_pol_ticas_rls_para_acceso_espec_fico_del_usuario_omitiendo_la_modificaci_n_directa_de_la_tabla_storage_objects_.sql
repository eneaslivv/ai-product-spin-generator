-- Create a storage bucket for product images and videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-spins', 'product-spins', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Policies for the 'product-spins' bucket
-- Policy for authenticated users to upload their own files
CREATE POLICY "Allow authenticated users to upload their own files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-spins' AND auth.uid() = owner);

-- Policy for authenticated users to view their own files
CREATE POLICY "Allow authenticated users to view their own files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'product-spins' AND auth.uid() = owner);

-- Policy for authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update their own files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'product-spins' AND auth.uid() = owner);

-- Policy for authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete their own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'product-spins' AND auth.uid() = owner);

-- Optional: If you want public read access for *all* files in this bucket (e.g., for sharing generated videos)
-- CREATE POLICY "Allow public read access for product spins" ON storage.objects
-- FOR SELECT
-- USING (bucket_id = 'product-spins');