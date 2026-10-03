alter table magic_links add column if not exists purpose text not null default 'login' check (purpose in ('login', 'code_reset'));
