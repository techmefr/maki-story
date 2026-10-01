create table if not exists recordings (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id),
    line_id text not null references lines(id) on delete cascade,
    member_id text not null,
    language text not null check (language <> ''),
    file_id text not null,
    duration_ms int not null default 0,
    mime text not null,
    status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'changes_requested', 'stale')),
    created_at timestamptz not null default now()
);

create unique index if not exists recordings_line_language_key on recordings (line_id, language);
create index if not exists recordings_family_idx on recordings (family_id);
create index if not exists recordings_member_idx on recordings (member_id);

create table if not exists line_translations (
    line_id text not null references lines(id) on delete cascade,
    family_id text not null references families(id),
    language text not null check (language <> ''),
    text text not null,
    tone text not null default '',
    created_at timestamptz not null default now(),
    primary key (line_id, language)
);

create index if not exists line_translations_family_idx on line_translations (family_id);

insert into recordings (family_id, line_id, member_id, language, file_id, duration_ms, mime, status, created_at)
select l.family_id, l.id, l.member_id, 'fr', l.audio_file_id, l.audio_ms, f.mime, 'approved', now()
from lines l
join files f on f.id = l.audio_file_id
where l.audio_file_id is not null and l.member_id is not null
on conflict do nothing;
