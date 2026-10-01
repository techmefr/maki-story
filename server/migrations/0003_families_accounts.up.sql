create table if not exists families (
    id text primary key default gen_random_uuid()::text,
    name text not null,
    invite_code text not null unique,
    plan text not null default 'free',
    owner_pending boolean not null default false,
    created_at timestamptz not null default now(),
    deleted_at timestamptz
);

create table if not exists accounts (
    id text primary key default gen_random_uuid()::text,
    email text not null,
    password_hash text not null,
    created_at timestamptz not null default now()
);

create unique index if not exists accounts_email_key on accounts (lower(email));

create table if not exists account_families (
    account_id text not null references accounts(id) on delete cascade,
    family_id text not null references families(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (account_id, family_id)
);

alter table members add column if not exists family_id text references families(id);
alter table members add column if not exists pin_hash text;
alter table members add column if not exists status text not null default 'active';
alter table books add column if not exists family_id text references families(id);
alter table book_pages add column if not exists family_id text references families(id);
alter table lines add column if not exists family_id text references families(id);
alter table book_voices add column if not exists family_id text references families(id);
alter table files add column if not exists family_id text references families(id);
alter table messages add column if not exists family_id text references families(id);
alter table feedback add column if not exists family_id text references families(id);

do $$
declare
    legacy_id text;
begin
    if exists (select 1 from members where family_id is null)
        or exists (select 1 from books where family_id is null)
        or exists (select 1 from files where family_id is null)
        or exists (select 1 from messages where family_id is null)
        or exists (select 1 from feedback where family_id is null) then
        insert into families (name, invite_code, owner_pending)
        values ('Famille', substr(md5(random()::text || clock_timestamp()::text), 1, 10), true)
        returning id into legacy_id;
        update members set family_id = legacy_id where family_id is null;
        update books set family_id = legacy_id where family_id is null;
        update files set family_id = legacy_id where family_id is null;
        update messages set family_id = legacy_id where family_id is null;
        update feedback set family_id = legacy_id where family_id is null;
    end if;
    update book_pages p set family_id = b.family_id from books b where p.book_id = b.id and p.family_id is null;
    update lines l set family_id = b.family_id from books b where l.book_id = b.id and l.family_id is null;
    update book_voices v set family_id = b.family_id from books b where v.book_id = b.id and v.family_id is null;
end $$;

alter table members alter column family_id set not null;
alter table books alter column family_id set not null;
alter table book_pages alter column family_id set not null;
alter table lines alter column family_id set not null;
alter table book_voices alter column family_id set not null;
alter table files alter column family_id set not null;
alter table messages alter column family_id set not null;
alter table feedback alter column family_id set not null;

create index if not exists members_family_idx on members (family_id);
create index if not exists books_family_idx on books (family_id);
create index if not exists files_family_idx on files (family_id);
create index if not exists messages_family_idx on messages (family_id);
create index if not exists feedback_family_idx on feedback (family_id);
