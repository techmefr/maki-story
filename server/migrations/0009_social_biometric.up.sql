create table if not exists account_identities (
    provider text not null,
    subject text not null,
    account_id text not null references accounts(id) on delete cascade,
    email text,
    created_at timestamptz not null default now(),
    primary key (provider, subject)
);

create index if not exists account_identities_account_idx on account_identities (account_id);

create table if not exists member_devices (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id) on delete cascade,
    member_id text not null references members(id) on delete cascade,
    label text not null,
    secret_hash text not null,
    created_at timestamptz not null default now(),
    last_used_at timestamptz,
    revoked_at timestamptz
);

create index if not exists member_devices_member_idx on member_devices (member_id);
create index if not exists member_devices_family_idx on member_devices (family_id);
