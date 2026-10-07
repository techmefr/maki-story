select 1;
update books set status = 'ready'
where status in ('to_record', 'in_review') and deleted_at is null
    and exists (
        select 1 from lines l join recordings r on r.line_id = l.id
        where l.book_id = books.id and r.status = 'approved'
    )
    and not exists (
        select 1 from lines l join recordings r on r.line_id = l.id
        where l.book_id = books.id and r.status = 'submitted'
    );
