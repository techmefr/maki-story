alter table book_pages add column if not exists is_silent boolean not null default false;
update book_pages set is_silent = true where kind = 'empty';

alter table characters add column if not exists assignment text not null default 'later';
update characters c set assignment = 'relative'
where exists (select 1 from lines l where l.character_id = c.id and l.member_id is not null);

create table if not exists book_drafts (
    member_id text primary key references members(id) on delete cascade,
    family_id text not null references families(id) on delete cascade,
    payload jsonb not null,
    updated_at timestamptz not null default now()
);

alter table books add column if not exists description text not null default '';
