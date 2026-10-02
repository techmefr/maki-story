alter table books add column if not exists child_visible boolean;
alter table members add column if not exists age_shift int not null default 0 check (age_shift between -5 and 5);
alter table families add column if not exists ai_monthly_budget_usd numeric(10, 4) check (ai_monthly_budget_usd >= 0);
alter table recordings add column if not exists deleted_status text;

create index if not exists messages_trash_idx on messages (family_id, deleted_at) where deleted_at is not null;
create index if not exists treasures_trash_idx on treasures (family_id, deleted_at) where deleted_at is not null;
create index if not exists error_log_retention_idx on error_log (created_at);
