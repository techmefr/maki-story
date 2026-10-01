alter table families add column if not exists invite_revoked_at timestamptz;

alter table books add column if not exists origin_book_id text references books(id) on delete set null;
alter table books add column if not exists origin_family_id text references families(id) on delete set null;

alter table members add column if not exists voice_policy text not null default 'keep' check (voice_policy in ('keep', 'block', 'rerecord'));
alter table members add column if not exists source_family_id text references families(id) on delete set null;
alter table members add column if not exists source_member_id text;

create unique index if not exists members_guest_key on members (family_id, source_member_id) where source_member_id is not null;

alter table upload_sessions add column if not exists member_id text references members(id) on delete cascade;

create table if not exists book_shares (
    id text primary key default gen_random_uuid()::text,
    book_id text not null references books(id) on delete cascade,
    root_book_id text not null,
    owner_family_id text not null references families(id),
    target_family_id text not null references families(id),
    approver_family_id text references families(id),
    mode text not null check (mode in ('record', 'copy')),
    status text not null check (status in ('proposed', 'awaiting_owner', 'pending', 'accepted', 'declined', 'revoked')),
    proposed_by_member_id text references members(id) on delete set null,
    recorder_member_id text references members(id) on delete set null,
    copied_book_id text references books(id) on delete set null,
    message text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (owner_family_id <> target_family_id)
);

create unique index if not exists book_shares_active_key on book_shares (book_id, target_family_id, mode)
    where status in ('proposed', 'awaiting_owner', 'pending', 'accepted');
create index if not exists book_shares_owner_idx on book_shares (owner_family_id);
create index if not exists book_shares_target_idx on book_shares (target_family_id);
create index if not exists book_shares_approver_idx on book_shares (approver_family_id);
create index if not exists book_shares_root_idx on book_shares (root_book_id);

create table if not exists share_lines (
    share_id text not null references book_shares(id) on delete cascade,
    line_id text not null references lines(id) on delete cascade,
    primary key (share_id, line_id)
);

create table if not exists notifications (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id),
    recipient_member_id text references members(id) on delete cascade,
    kind text not null,
    payload jsonb not null default '{}'::jsonb,
    group_key text,
    count int not null default 1,
    read_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists notifications_family_idx on notifications (family_id, updated_at desc);
create index if not exists notifications_group_idx on notifications (family_id, group_key) where group_key is not null;
