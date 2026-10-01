alter table members add column if not exists code_kind text;
alter table members add column if not exists code_failed_attempts integer not null default 0;
alter table members add column if not exists code_locked_until timestamptz;

update members set code_kind = 'pin' where pin_hash is not null and code_kind is null;
