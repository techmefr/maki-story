drop table if exists book_tags;
drop table if exists tag_translations;
drop table if exists tags;
alter table families drop column if exists tags_seeded_at;
