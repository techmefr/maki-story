alter table families add column if not exists tags_seeded_at timestamptz;

create table if not exists tags (
    id text primary key default gen_random_uuid()::text,
    family_id text not null references families(id) on delete cascade,
    slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    color text not null check (color in ('coral', 'sun', 'mint', 'sky', 'grape', 'pink')),
    icon text not null,
    keywords text[] not null default array[]::text[],
    created_at timestamptz not null default now()
);

create unique index if not exists tags_family_slug_key on tags (family_id, slug);

create table if not exists tag_translations (
    tag_id text not null references tags(id) on delete cascade,
    family_id text not null references families(id) on delete cascade,
    language text not null check (language ~ '^[a-z]{2,3}$'),
    name text not null check (btrim(name) <> ''),
    primary key (tag_id, language)
);

create index if not exists tag_translations_family_idx on tag_translations (family_id);

create table if not exists book_tags (
    book_id text not null references books(id) on delete cascade,
    family_id text not null,
    slug text not null,
    is_auto boolean not null default false,
    created_at timestamptz not null default now(),
    primary key (book_id, slug),
    foreign key (family_id, slug) references tags (family_id, slug) on delete cascade on update cascade
);

create index if not exists book_tags_family_slug_idx on book_tags (family_id, slug);
