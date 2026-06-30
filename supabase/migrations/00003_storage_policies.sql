-- Allow anon to read/write files in client-uploads
CREATE POLICY "anon_select_client_uploads"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'client-uploads');

CREATE POLICY "anon_insert_client_uploads"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'client-uploads');

CREATE POLICY "anon_update_client_uploads"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'client-uploads')
  WITH CHECK (bucket_id = 'client-uploads');

CREATE POLICY "anon_delete_client_uploads"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'client-uploads');
