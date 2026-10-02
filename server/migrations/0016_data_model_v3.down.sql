drop index if exists members_trash_idx;
drop index if exists recordings_trash_idx;
drop index if exists books_trash_idx;
drop table if exists family_tombstones;
drop table if exists error_log;

drop index if exists audit_log_retention_idx;
drop index if exists audit_log_entity_idx;
alter table audit_log drop column if exists outcome;
alter table audit_log drop column if exists request_id;
alter table audit_log drop column if exists after;
alter table audit_log drop column if exists before;
alter table audit_log drop column if exists entity_id;
alter table audit_log drop column if exists entity_type;
alter table audit_log drop column if exists actor_account_id;

drop table if exists moderation_log;
drop table if exists notification_preferences;
drop table if exists push_subscriptions;
drop table if exists invitations;
drop table if exists parental_overrides;
drop trigger if exists treasures_limit on treasures;
drop function if exists enforce_treasure_limit();
drop table if exists treasures;
drop table if exists memberships;

drop index if exists messages_recipient_idx;
drop index if exists messages_expiry_idx;
drop index if exists messages_one_active_key;
alter table messages drop column if exists status;
alter table messages drop column if exists expires_at;
alter table messages drop column if exists first_listened_at;
alter table messages drop column if exists kind;

alter table recordings drop column if exists deleted_at;

alter table books drop column if exists themes;
alter table books drop column if exists moods;
alter table books drop column if exists voice_languages;
alter table books drop column if exists written_language;

alter table members drop column if exists birthday_celebrated_year;
alter table members drop column if exists code_enabled;
alter table members drop column if exists birth_date;
