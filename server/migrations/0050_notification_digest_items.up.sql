create table if not exists notification_digest_items (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id) on delete cascade,
    member_id text not null references members(id) on delete cascade,
    account_id text not null references accounts(id) on delete cascade,
    kind text not null,
    payload jsonb not null default '{}'::jsonb,
    count int not null default 1,
    created_at timestamptz not null default now(),
    sent_at timestamptz
);

create index if not exists notification_digest_items_pending_idx on notification_digest_items (account_id, created_at) where sent_at is null;
create index if not exists notification_digest_items_retention_idx on notification_digest_items (created_at);
