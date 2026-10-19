alter table upload_sessions add column file_id text references files(id) on delete set null;
