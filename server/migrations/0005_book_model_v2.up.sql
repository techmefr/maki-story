alter table books add column if not exists subtitle text not null default '';
alter table books add column if not exists author text not null default '';
alter table books add column if not exists age_min int;
alter table books add column if not exists age_max int;
alter table books add column if not exists language text not null default 'fr';
alter table books add column if not exists type text not null default 'standard';
alter table books add column if not exists tts_fallback boolean not null default false;

alter table book_pages alter column file_id drop not null;
alter table book_pages add column if not exists kind text not null default 'content';
alter table book_pages add column if not exists tts_fallback boolean not null default false;

create table if not exists characters (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id),
    book_id text not null references books(id) on delete cascade,
    name text not null,
    color text,
    description text not null default '',
    is_narrator boolean not null default false,
    position int not null default 0,
    created_at timestamptz not null default now()
);

create unique index if not exists characters_book_name_key on characters (book_id, lower(name));
create unique index if not exists characters_book_narrator_key on characters (book_id) where is_narrator;
create index if not exists characters_family_idx on characters (family_id);

create table if not exists panels (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id),
    book_id text not null references books(id) on delete cascade,
    page_id text not null references book_pages(id) on delete cascade,
    position int not null,
    description text not null default '',
    created_at timestamptz not null default now()
);

create unique index if not exists panels_page_position_key on panels (page_id, position);
create index if not exists panels_family_idx on panels (family_id);

alter table lines add column if not exists character_id text references characters(id) on delete set null;
alter table lines add column if not exists panel_id text references panels(id) on delete set null;
alter table lines add column if not exists tone text not null default '';
alter table lines add column if not exists scene_description text not null default '';

insert into characters (family_id, book_id, name, color, is_narrator, position)
select
    d.family_id,
    d.book_id,
    d.name,
    (select min(m.color) from lines l2 join members m on m.id = l2.member_id
        where l2.book_id = d.book_id and l2.character = d.name),
    lower(d.name) = 'narrateur',
    (row_number() over (partition by d.book_id order by d.first_position) - 1)::int
from (
    select book_id, family_id, character as name, min(position) as first_position
    from lines
    where trim(character) <> ''
    group by book_id, family_id, character
) d
on conflict do nothing;

update lines l set character_id = c.id
from characters c
where c.book_id = l.book_id and lower(c.name) = lower(l.character) and l.character_id is null;

create index if not exists lines_character_idx on lines (character_id);
create index if not exists lines_panel_idx on lines (panel_id);
