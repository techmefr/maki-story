alter table members add column if not exists books_restricted boolean not null default false;

create table if not exists book_access (
    child_id text not null references members(id) on delete cascade,
    book_id text not null references books(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (child_id, book_id)
);

create index if not exists book_access_book_idx on book_access (book_id);
