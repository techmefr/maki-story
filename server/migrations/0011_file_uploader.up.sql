alter table files add column if not exists created_by_member_id text references members(id);

create index if not exists files_created_by_idx on files (created_by_member_id);
