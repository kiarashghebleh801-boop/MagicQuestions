-- Shared study resources for signed-in users, matching Chemistry and Physics.
-- Buckets remain private. This grants no upload, update or delete access.
create policy "biology papers authenticated read"
on storage.objects for select to authenticated
using (bucket_id = 'bio papers');

create policy "biology markschemes authenticated read"
on storage.objects for select to authenticated
using (bucket_id = 'bio markschemes');
