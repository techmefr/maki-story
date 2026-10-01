create table if not exists child_schedules (
    member_id text primary key references members(id) on delete cascade,
    family_id text not null references families(id) on delete cascade,
    is_enabled boolean not null default false,
    weekly jsonb not null default '[]'::jsonb,
    timezone text not null default 'UTC',
    is_manual_block boolean not null default false,
    manual_until timestamptz,
    updated_at timestamptz not null default now()
);

create index if not exists child_schedules_family_idx on child_schedules (family_id);

create table if not exists audit_log (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id) on delete cascade,
    actor_member_id text,
    target_member_id text,
    action text not null,
    details jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists audit_log_family_idx on audit_log (family_id, created_at desc);
