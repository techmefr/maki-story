create table if not exists allowed_providers (
    family_id text not null references families(id) on delete cascade,
    provider text not null check (provider in ('apple', 'microsoft', 'facebook')),
    is_enabled boolean not null default true,
    updated_at timestamptz not null default now(),
    primary key (family_id, provider)
);
