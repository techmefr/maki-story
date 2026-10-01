alter table accounts drop column if exists password_changed_at;
alter table members drop column if exists app_locale;
alter table members drop column if exists spoken_languages;
