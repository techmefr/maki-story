create table auth_identity_deletions (
    user_id uuid primary key,
    created_at timestamptz not null default now(),
    attempts integer not null default 0,
    last_attempt_at timestamptz
);

create function enqueue_auth_identity_deletion() returns trigger as $$
begin
    if old.supabase_user_id is not null then
        insert into auth_identity_deletions (user_id) values (old.supabase_user_id) on conflict do nothing;
    end if;
    return old;
end;
$$ language plpgsql;

create trigger account_identity_deletion after delete on accounts for each row execute function enqueue_auth_identity_deletion();
