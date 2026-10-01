create table if not exists files (
        id text primary key default gen_random_uuid()::text,
        mime text not null,
        data bytea not null,
        created_at timestamptz not null default now()
    );

create table if not exists members (
        id text primary key default gen_random_uuid()::text,
        name text not null,
        role text not null,
        color text not null,
        photo_file_id text,
        created_at timestamptz not null default now()
    );

create table if not exists books (
        id text primary key default gen_random_uuid()::text,
        title text not null,
        kind text not null default 'multi',
        solo_member_id text,
        status text not null default 'draft',
        image_desc text not null default '',
        created_at timestamptz not null default now()
    );

create table if not exists book_pages (
        id text primary key default gen_random_uuid()::text,
        book_id text not null references books(id) on delete cascade,
        position int not null,
        file_id text not null
    );

create table if not exists lines (
        id text primary key default gen_random_uuid()::text,
        book_id text not null references books(id) on delete cascade,
        position int not null,
        page_index int not null default 0,
        character text not null default '',
        text text not null,
        note text not null default '',
        member_id text,
        audio_file_id text,
        audio_ms int not null default 0
    );

create table if not exists book_voices (
        book_id text not null references books(id) on delete cascade,
        member_id text not null,
        tone text not null default '',
        primary key (book_id, member_id)
    );

create table if not exists messages (
        id text primary key default gen_random_uuid()::text,
        from_member_id text not null,
        to_member_id text not null,
        file_id text not null,
        mime text not null,
        duration_ms int not null default 0,
        listened_at timestamptz,
        created_at timestamptz not null default now()
    );

create table if not exists feedback (
        id text primary key default gen_random_uuid()::text,
        member_name text not null default '',
        screen text not null default '',
        mood text,
        text text not null default '',
        created_at timestamptz not null default now()
    );
