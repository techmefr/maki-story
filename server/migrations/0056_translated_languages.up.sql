alter table books add column if not exists translated_languages text[] not null default array[]::text[];
