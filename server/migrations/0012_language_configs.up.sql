create table if not exists language_configs (
    member_id text not null references members(id) on delete cascade,
    book_id text not null default '',
    family_id text not null references families(id),
    languages text[] not null check (cardinality(languages) between 1 and 8),
    is_locked boolean not null default false,
    updated_at timestamptz not null default now(),
    primary key (member_id, book_id)
);

create index if not exists language_configs_family_idx on language_configs (family_id);
