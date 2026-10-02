alter table invitations add column if not exists name text not null default '';
alter table invitations add column if not exists member_id text references members(id) on delete set null;
alter table invitations add column if not exists revoked_at timestamptz;

create unique index if not exists memberships_member_key on memberships (member_id) where member_id is not null;
create index if not exists memberships_account_idx on memberships (account_id, status);

create table if not exists notification_deliveries (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id) on delete cascade,
    member_id text references members(id) on delete set null,
    kind text not null,
    channel text not null check (channel in ('PUSH', 'EMAIL')),
    status text not null check (status in ('SENT', 'SUPPRESSED', 'FAILED')),
    reason text not null default '',
    provider text not null default '',
    created_at timestamptz not null default now()
);

create index if not exists notification_deliveries_family_idx on notification_deliveries (family_id, created_at desc);
create index if not exists notification_deliveries_retention_idx on notification_deliveries (created_at);
