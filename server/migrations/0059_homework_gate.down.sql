drop index if exists homework_requests_pending_key;
drop index if exists homework_requests_child_idx;
drop table if exists homework_requests;
alter table members drop column if exists homework_follow;
