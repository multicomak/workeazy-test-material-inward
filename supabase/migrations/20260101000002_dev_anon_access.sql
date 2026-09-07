-- DEV ONLY. There is no auth UI in scope yet, so the app connects with the anon
-- key and no session. Without this the authenticated-role policies would block
-- every read and the app would appear empty.
--
-- Drop this migration the moment sign-in lands. See DECISIONS.md.

create policy materials_anon_dev on materials
  for all to anon using (true) with check (true);
create policy inward_entries_anon_dev on inward_entries
  for all to anon using (true) with check (true);
create policy is808_sections_anon_dev on is808_sections
  for all to anon using (true) with check (true);
create policy di_pipe_classes_anon_dev on di_pipe_classes
  for all to anon using (true) with check (true);
