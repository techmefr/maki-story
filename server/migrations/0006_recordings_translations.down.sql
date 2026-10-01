update lines set audio_file_id = null, audio_ms = 0;
update lines l set audio_file_id = r.file_id, audio_ms = r.duration_ms
from recordings r, books b
where r.line_id = l.id and b.id = l.book_id and r.language = b.language;
drop table if exists line_translations;
drop table if exists recordings;
