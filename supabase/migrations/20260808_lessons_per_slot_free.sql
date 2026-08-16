-- Per-slot free preview.
--
-- `is_free` unlocks the whole lesson (page + video). These two let a paid
-- lesson still hand out its supporting material — the illustrative PDF or
-- attachment — without giving away the video.
alter table lessons
  add column if not exists pdf_is_free  boolean not null default false,
  add column if not exists file_is_free boolean not null default false;
