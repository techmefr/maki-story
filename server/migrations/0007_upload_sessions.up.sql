create table if not exists upload_sessions (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id) on delete cascade,
    mime text not null,
    size int not null check (size > 0),
    received int not null default 0,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
);

create index if not exists upload_sessions_family_idx on upload_sessions (family_id);
create index if not exists upload_sessions_expires_idx on upload_sessions (expires_at);

create table if not exists upload_chunks (
    upload_id text not null references upload_sessions(id) on delete cascade,
    chunk_offset int not null,
    data bytea not null,
    primary key (upload_id, chunk_offset)
);
