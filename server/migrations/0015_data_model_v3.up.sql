alter table members add column if not exists birth_date date;
alter table members add column if not exists code_enabled boolean not null default true;
alter table members add column if not exists birthday_celebrated_year int;

update members
set pin_hash = null, code_kind = null, code_failed_attempts = 0, code_locked_until = null, code_enabled = false
where code_kind = 'shapes';

alter table books add column if not exists written_language text not null default 'fr';
alter table books add column if not exists voice_languages text[] not null default array[]::text[];
alter table books add column if not exists moods text[] not null default array[]::text[];
alter table books add column if not exists themes text[] not null default array[]::text[];

update books set written_language = language;
update books b set voice_languages = coalesce((
    select array_agg(distinct r.language order by r.language)
    from recordings r join lines l on l.id = r.line_id
    where l.book_id = b.id
), array[]::text[]);

alter table recordings add column if not exists deleted_at timestamptz;

alter table messages add column if not exists kind text not null default 'NORMAL' check (kind in ('NORMAL', 'BIRTHDAY'));
alter table messages add column if not exists first_listened_at timestamptz;
alter table messages add column if not exists expires_at timestamptz;
alter table messages add column if not exists status text not null default 'ACTIVE' check (status in ('ACTIVE', 'EXPIRED', 'DELETED'));

update messages set first_listened_at = listened_at, expires_at = now() + interval '24 hours' where listened_at is not null;
update messages set status = 'DELETED' where deleted_at is not null;
update messages m set status = 'EXPIRED', expires_at = coalesce(m.expires_at, now())
from (
    select id, row_number() over (partition by from_member_id, to_member_id, kind order by created_at desc, id desc) as position
    from messages where status = 'ACTIVE'
) ranked
where ranked.id = m.id and ranked.position > 1;

create unique index if not exists messages_one_active_key on messages (from_member_id, to_member_id, kind) where status = 'ACTIVE';
create index if not exists messages_expiry_idx on messages (expires_at) where status = 'ACTIVE' and expires_at is not null;
create index if not exists messages_recipient_idx on messages (family_id, to_member_id, status);

create table if not exists memberships (
    id text primary key default gen_random_uuid()::text,
    account_id text not null references accounts(id) on delete cascade,
    family_id text not null references families(id) on delete cascade,
    member_id text references members(id) on delete set null,
    role text not null check (role in ('parent', 'relative')),
    status text not null default 'ACTIVE' check (status in ('ACTIVE', 'LEFT', 'DECEASED', 'BLOCKED')),
    child_ids text[] not null default array[]::text[],
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (account_id, family_id)
);

create index if not exists memberships_family_idx on memberships (family_id);

insert into memberships (account_id, family_id, role)
select account_id, family_id, 'parent' from account_families
on conflict do nothing;

create table if not exists treasures (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id) on delete cascade,
    child_id text not null references members(id) on delete cascade,
    source_message_id text references messages(id) on delete set null,
    from_member_id text references members(id) on delete set null,
    file_id text not null references files(id),
    mime text not null,
    duration_ms int not null default 0,
    saved_by_member_id text references members(id) on delete set null,
    created_at timestamptz not null default now(),
    deleted_at timestamptz
);

create unique index if not exists treasures_child_source_key on treasures (child_id, source_message_id) where source_message_id is not null and deleted_at is null;
create index if not exists treasures_child_idx on treasures (family_id, child_id, created_at);

create or replace function enforce_treasure_limit() returns trigger as $$
begin
    perform pg_advisory_xact_lock(hashtext(new.child_id));
    if (select count(*) from treasures where child_id = new.child_id and deleted_at is null) >= 10 then
        raise exception 'treasure box is full' using errcode = 'check_violation';
    end if;
    return new;
end;
$$ language plpgsql;

drop trigger if exists treasures_limit on treasures;
create trigger treasures_limit before insert on treasures for each row execute function enforce_treasure_limit();

create table if not exists parental_overrides (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id) on delete cascade,
    child_id text not null references members(id) on delete cascade,
    kind text not null check (kind in ('UNLOCK', 'LOCK')),
    starts_at timestamptz not null default now(),
    ends_at timestamptz not null,
    created_by_member_id text references members(id) on delete set null,
    created_at timestamptz not null default now(),
    check (ends_at > starts_at)
);

create index if not exists parental_overrides_child_idx on parental_overrides (family_id, child_id, ends_at);

create table if not exists invitations (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id) on delete cascade,
    code text not null unique,
    channel text not null check (channel in ('WHATSAPP', 'SMS', 'EMAIL', 'LINK')),
    role text not null default 'relative' check (role in ('parent', 'relative')),
    child_ids text[] not null default array[]::text[],
    contact text,
    created_by_member_id text references members(id) on delete set null,
    expires_at timestamptz not null,
    used_at timestamptz,
    used_by_account_id text references accounts(id) on delete set null,
    created_at timestamptz not null default now()
);

create index if not exists invitations_family_idx on invitations (family_id, created_at desc);

create table if not exists push_subscriptions (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id) on delete cascade,
    account_id text references accounts(id) on delete cascade,
    member_id text references members(id) on delete cascade,
    platform text not null check (platform in ('WEB', 'IOS', 'ANDROID')),
    endpoint text not null unique,
    keys jsonb not null default '{}'::jsonb,
    user_agent text not null default '',
    created_at timestamptz not null default now(),
    last_used_at timestamptz,
    revoked_at timestamptz
);

create index if not exists push_subscriptions_member_idx on push_subscriptions (family_id, member_id) where revoked_at is null;

create table if not exists notification_preferences (
    member_id text not null references members(id) on delete cascade,
    family_id text not null references families(id) on delete cascade,
    kind text not null,
    channel text not null check (channel in ('IN_APP', 'PUSH', 'EMAIL')),
    is_enabled boolean not null default true,
    updated_at timestamptz not null default now(),
    primary key (member_id, kind, channel)
);

create index if not exists notification_preferences_family_idx on notification_preferences (family_id);

create table if not exists moderation_log (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id) on delete cascade,
    ai_job_id text references ai_jobs(id) on delete set null,
    subject text not null check (subject in ('TEXT', 'IMAGE')),
    verdict text not null check (verdict in ('PASSED', 'FLAGGED', 'BLOCKED')),
    categories text[] not null default array[]::text[],
    action text not null default 'NONE' check (action in ('NONE', 'REGENERATED', 'REFUSED')),
    detail jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists moderation_log_family_idx on moderation_log (family_id, created_at desc);

alter table audit_log add column if not exists actor_account_id text;
alter table audit_log add column if not exists entity_type text;
alter table audit_log add column if not exists entity_id text;
alter table audit_log add column if not exists before jsonb;
alter table audit_log add column if not exists after jsonb;
alter table audit_log add column if not exists request_id text;
alter table audit_log add column if not exists outcome text not null default 'SUCCESS' check (outcome in ('SUCCESS', 'DENIED', 'FAILURE'));

create index if not exists audit_log_entity_idx on audit_log (family_id, entity_type, entity_id, created_at desc);
create index if not exists audit_log_retention_idx on audit_log (created_at);

create table if not exists error_log (
    id text primary key default gen_random_uuid()::text,
    family_id text references families(id) on delete set null,
    source text not null check (source in ('SERVER', 'CLIENT')),
    route text not null default '',
    method text not null default '',
    status int,
    message text not null default '',
    fingerprint text not null default '',
    user_agent text not null default '',
    app_version text not null default '',
    role text,
    request_id text,
    created_at timestamptz not null default now()
);

create index if not exists error_log_created_idx on error_log (created_at desc);
create index if not exists error_log_family_idx on error_log (family_id, created_at desc);

create table if not exists family_tombstones (
    family_id text primary key,
    deleted_at timestamptz not null default now(),
    restore_until timestamptz not null,
    sealed_payload bytea
);

create index if not exists books_trash_idx on books (family_id, deleted_at) where deleted_at is not null;
create index if not exists recordings_trash_idx on recordings (family_id, deleted_at) where deleted_at is not null;
create index if not exists members_trash_idx on members (family_id, deleted_at) where deleted_at is not null;
