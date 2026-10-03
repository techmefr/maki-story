create table if not exists magic_links (
    id text primary key default gen_random_uuid()::text,
    account_id text not null references accounts(id) on delete cascade,
    token_hash text not null,
    expires_at timestamptz not null,
    used_at timestamptz,
    created_at timestamptz not null default now()
);

create unique index if not exists magic_links_token_key on magic_links (token_hash);
create index if not exists magic_links_account_idx on magic_links (account_id, created_at desc);
