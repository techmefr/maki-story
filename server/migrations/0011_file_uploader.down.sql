drop index if exists files_created_by_idx;

alter table files drop column if exists created_by_member_id;
