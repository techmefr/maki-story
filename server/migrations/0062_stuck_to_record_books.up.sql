select 1;
update books set status = 'ready'
where status in ('to_record', 'in_review') and deleted_at is null
    and exists (select 1 from lines l where l.book_id = books.id and btrim(l.text) <> '')
    and not exists (
        select 1 from lines l
        where l.book_id = books.id and btrim(l.text) <> ''
            and not exists (select 1 from recordings r where r.line_id = l.id and r.status = 'approved')
    );
update books set status = 'in_review'
where status = 'to_record' and deleted_at is null
    and not exists (
        select 1 from lines l
        where l.book_id = books.id and btrim(l.text) <> ''
            and not exists (select 1 from recordings r where r.line_id = l.id and r.status in ('draft', 'submitted', 'approved'))
    )
    and exists (
        select 1 from lines l join recordings r on r.line_id = l.id
        where l.book_id = books.id and r.status in ('submitted', 'approved')
    );
