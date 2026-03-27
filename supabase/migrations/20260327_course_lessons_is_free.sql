-- Add is_free column to course_lessons
alter table course_lessons
  add column if not exists is_free boolean not null default false;
