drop table if exists notification_deliveries;
drop index if exists memberships_account_idx;
drop index if exists memberships_member_key;
alter table invitations drop column if exists revoked_at;
alter table invitations drop column if exists name;
alter table invitations drop column if exists member_id;
