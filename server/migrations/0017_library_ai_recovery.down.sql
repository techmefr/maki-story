drop index if exists error_log_retention_idx;
drop index if exists treasures_trash_idx;
drop index if exists messages_trash_idx;
alter table recordings drop column if exists deleted_status;
alter table families drop column if exists ai_monthly_budget_usd;
alter table members drop column if exists age_shift;
alter table books drop column if exists child_visible;
