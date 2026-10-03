drop index if exists messages_sender_active_idx;
create unique index if not exists messages_one_active_key on messages (from_member_id, to_member_id, kind) where status = 'ACTIVE';
