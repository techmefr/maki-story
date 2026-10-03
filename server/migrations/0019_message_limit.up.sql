drop index if exists messages_one_active_key;
create index if not exists messages_sender_active_idx on messages (from_member_id, to_member_id) where status = 'ACTIVE';
