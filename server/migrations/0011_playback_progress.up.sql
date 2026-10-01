create table if not exists playback_progress (
    member_id text not null references members(id) on delete cascade,
    book_id text not null references books(id) on delete cascade,
    family_id text not null references families(id),
    page_index int not null default 0,
    line_index int not null default 0,
    position_ms int not null default 0,
    updated_at timestamptz not null default now(),
    primary key (member_id, book_id)
);

create index if not exists playback_progress_family_idx on playback_progress (family_id);
