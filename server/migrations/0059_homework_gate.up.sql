alter table members add column if not exists homework_follow boolean not null default false;

create table if not exists homework_requests (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id) on delete cascade,
    child_id text not null references members(id) on delete cascade,
    status text not null default 'pending' check (status in ('pending', 'approved', 'refused')),
    decided_by_member_id text references members(id) on delete set null,
    decided_at timestamptz,
    valid_until timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists homework_requests_child_idx on homework_requests (family_id, child_id, created_at desc);
create unique index if not exists homework_requests_pending_key on homework_requests (child_id) where status = 'pending';
