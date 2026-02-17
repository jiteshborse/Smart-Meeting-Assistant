-- Create a new private bucket 'meeting-recordings'
insert into storage.buckets (id, name, public)
values ('meeting-recordings', 'meeting-recordings', true);

-- Policy: Allow authenticated users to upload their own recordings
-- Path structure: user_id/meeting_id/filename
create policy "Users can upload their own recordings"
on storage.objects for insert
with check (
  bucket_id = 'meeting-recordings' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to view/download their own recordings
create policy "Users can view their own recordings"
on storage.objects for select
using (
  bucket_id = 'meeting-recordings' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update their own recordings
create policy "Users can update their own recordings"
on storage.objects for update
with check (
  bucket_id = 'meeting-recordings' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own recordings
create policy "Users can delete their own recordings"
on storage.objects for delete
using (
  bucket_id = 'meeting-recordings' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
