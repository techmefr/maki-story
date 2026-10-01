alter table members drop column if exists deleted_at;
alter table books drop column if exists deleted_at;
alter table messages drop column if exists deleted_at;
alter table feedback drop column if exists deleted_at;
