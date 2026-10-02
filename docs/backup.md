# Backups and restore

- Daily logical backup: pg_dump --format=custom of the production database, kept 14 days, stored outside the database provider (object storage with versioning).
- On Neon, in addition, a branch of the production database is created before every migration and kept 7 days.
- Uploaded files are stored in the database (files table) and are covered by the same dump.
- Restore: create an empty database, run pg_restore --no-owner into it, check the row counts of families, members, books, then point DATABASE_URL to it.
- A family deleted by its parent is erased from the backups at their natural expiry (14 days); a tombstone row keeps only the id and date.
- Test a restore once a month on a scratch database.
