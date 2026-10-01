create table if not exists review_comments (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id),
    book_id text not null references books(id) on delete cascade,
    line_id text references lines(id) on delete cascade,
    recording_id text references recordings(id) on delete set null,
    author_member_id text not null references members(id) on delete cascade,
    body text not null check (btrim(body) <> ''),
    created_at timestamptz not null default now(),
    resolved_at timestamptz
);

create index if not exists review_comments_book_idx on review_comments (book_id, created_at);
create index if not exists review_comments_line_idx on review_comments (line_id) where resolved_at is null;

create table if not exists book_activity (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id),
    book_id text not null references books(id) on delete cascade,
    line_id text references lines(id) on delete set null,
    actor_member_id text references members(id) on delete set null,
    subject_member_id text references members(id) on delete set null,
    kind text not null,
    body text not null default '',
    count int not null default 1,
    created_at timestamptz not null default now()
);

create index if not exists book_activity_book_idx on book_activity (book_id, created_at desc);

create table if not exists book_visits (
    member_id text not null references members(id) on delete cascade,
    book_id text not null references books(id) on delete cascade,
    family_id text not null references families(id),
    last_seen_at timestamptz not null default now(),
    primary key (member_id, book_id)
);

create index if not exists book_visits_family_idx on book_visits (family_id);

update recordings set status = 'approved'
where status in ('draft', 'submitted')
  and line_id in (select l.id from lines l join books b on b.id = l.book_id where b.status = 'ready');
