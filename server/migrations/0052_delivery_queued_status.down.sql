delete from notification_deliveries where status = 'QUEUED';
alter table notification_deliveries drop constraint if exists notification_deliveries_status_check;
alter table notification_deliveries add constraint notification_deliveries_status_check check (status in ('SENT', 'SUPPRESSED', 'FAILED'));
