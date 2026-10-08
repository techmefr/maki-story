alter table members add column if not exists tour_status text check (tour_status in ('pending', 'done'));
