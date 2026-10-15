alter table parental_overrides drop constraint if exists parental_overrides_scope_check;
alter table parental_overrides drop column if exists scope;

drop index if exists homework_requests_pending_key;
delete from homework_requests where kind <> 'homework' or status = 'expired';
alter table homework_requests drop constraint if exists homework_requests_kind_check;
alter table homework_requests drop constraint if exists homework_requests_status_check;
alter table homework_requests add constraint homework_requests_status_check check (status in ('pending', 'approved', 'refused'));
alter table homework_requests drop column if exists expires_at;
alter table homework_requests drop column if exists kind;
create unique index if not exists homework_requests_pending_key on homework_requests (child_id) where status = 'pending';

drop index if exists access_controls_family_idx;
drop table if exists access_controls;
