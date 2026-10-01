create table if not exists ai_jobs (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id),
    member_id text references members(id),
    kind text not null check (kind in ('photo_prefill', 'book_generation', 'translation', 'image')),
    status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
    input jsonb not null default '{}'::jsonb,
    output jsonb,
    error text,
    model text not null default '',
    prompt_tokens int not null default 0,
    completion_tokens int not null default 0,
    cost_usd numeric(12, 6) not null default 0,
    created_at timestamptz not null default now(),
    finished_at timestamptz
);

create index if not exists ai_jobs_family_created_idx on ai_jobs (family_id, created_at);

alter table books add column if not exists ai_generated boolean not null default false;
