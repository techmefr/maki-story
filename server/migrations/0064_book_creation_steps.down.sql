drop table if exists book_drafts;
alter table books drop column if exists description;
alter table characters drop column if exists assignment;
alter table book_pages drop column if exists is_silent;
