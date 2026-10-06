alter table member_devices add column if not exists is_personal boolean not null default false;
