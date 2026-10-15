create table if not exists access_controls (
    member_id text primary key references members(id) on delete cascade,
    family_id text not null references families(id) on delete cascade,
    night_enabled boolean not null default false,
    night_from text not null default '21:00',
    night_to text not null default '07:00',
    listening_enabled boolean not null default false,
    listening_from text not null default '08:00',
    listening_to text not null default '19:00',
    homework_range_enabled boolean not null default false,
    homework_from text not null default '16:00',
    homework_to text not null default '19:00',
    approval_enabled boolean not null default false,
    timezone text not null default 'UTC',
    updated_at timestamptz not null default now()
);

create index if not exists access_controls_family_idx on access_controls (family_id);

alter table homework_requests add column if not exists kind text not null default 'homework';
alter table homework_requests add column if not exists expires_at timestamptz not null default now() + interval '10 minutes';
alter table homework_requests drop constraint if exists homework_requests_status_check;
alter table homework_requests add constraint homework_requests_status_check check (status in ('pending', 'approved', 'refused', 'expired'));
alter table homework_requests drop constraint if exists homework_requests_kind_check;
alter table homework_requests add constraint homework_requests_kind_check check (kind in ('homework', 'signin', 'exception'));

drop index if exists homework_requests_pending_key;
create unique index if not exists homework_requests_pending_key on homework_requests (child_id, kind) where status = 'pending';

alter table parental_overrides add column if not exists scope text not null default 'all';
alter table parental_overrides drop constraint if exists parental_overrides_scope_check;
alter table parental_overrides add constraint parental_overrides_scope_check check (scope in ('all', 'homework'));
