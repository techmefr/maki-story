alter table accounts add column if not exists terms_version text;
alter table accounts add column if not exists terms_accepted_at timestamptz;
