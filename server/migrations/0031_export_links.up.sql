create table if not exists export_links (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id) on delete cascade,
    account_id text not null references accounts(id) on delete cascade,
    token_hash text not null,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
);

create unique index if not exists export_links_token_key on export_links (token_hash);
create index if not exists export_links_family_idx on export_links (family_id, created_at desc);
