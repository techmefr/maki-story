alter table members add column if not exists spoken_languages text[] not null default array[]::text[];
alter table members add column if not exists app_locale text;
alter table accounts add column if not exists password_changed_at timestamptz;
