create table if not exists login_failures (
    id bigserial primary key,
    bucket text not null,
    created_at timestamptz not null default now()
);

create index if not exists login_failures_bucket_idx on login_failures (bucket, created_at);
