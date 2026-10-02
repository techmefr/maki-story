create table if not exists approved_takes (
    id text primary key,
    family_id text not null references families(id),
    line_id text not null references lines(id) on delete cascade,
    member_id text not null,
    language text not null check (language <> ''),
    file_id text not null,
    duration_ms int not null default 0,
    mime text not null,
    created_at timestamptz not null default now()
);

create unique index if not exists approved_takes_line_language_key on approved_takes (line_id, language);
create index if not exists approved_takes_family_idx on approved_takes (family_id);

create or replace view child_recordings as
    select id, family_id, line_id, member_id, language, file_id, duration_ms, mime, status, created_at
    from recordings where status = 'approved'
    union all
    select id, family_id, line_id, member_id, language, file_id, duration_ms, mime, 'approved', created_at
    from approved_takes;
