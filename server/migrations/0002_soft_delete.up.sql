alter table members add column if not exists deleted_at timestamptz;
alter table books add column if not exists deleted_at timestamptz;
alter table messages add column if not exists deleted_at timestamptz;
alter table feedback add column if not exists deleted_at timestamptz;
