create table if not exists notification_digests (
    account_id text not null references accounts(id) on delete cascade,
    digest_date date not null,
    item_count int not null default 0,
    created_at timestamptz not null default now(),
    primary key (account_id, digest_date)
);

create index if not exists notification_digests_retention_idx on notification_digests (created_at);
