update books set status = 'to_record' where status = 'in_review';
drop table if exists book_visits;
drop table if exists book_activity;
drop table if exists review_comments;
