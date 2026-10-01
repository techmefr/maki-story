alter table books drop column if exists ai_generated;
drop index if exists ai_jobs_family_created_idx;
drop table if exists ai_jobs;
