-- ─────────────────────────────────────────────
-- RLS policies: courses & course_lessons
-- Admin = profiles.role = 'admin'
-- ─────────────────────────────────────────────

-- Enable RLS (safe to run even if already enabled)
alter table courses       enable row level security;
alter table course_lessons enable row level security;

-- ── courses ──────────────────────────────────

-- Drop existing write policies if they exist (idempotent)
drop policy if exists "Admins can insert courses"  on courses;
drop policy if exists "Admins can update courses"  on courses;
drop policy if exists "Admins can delete courses"  on courses;

-- SELECT: anyone can read published courses (public listing)
drop policy if exists "Anyone can view published courses" on courses;
create policy "Anyone can view published courses"
  on courses for select
  using (is_published = true);

-- SELECT: admins can read all courses (including drafts)
drop policy if exists "Admins can view all courses" on courses;
create policy "Admins can view all courses"
  on courses for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- INSERT
create policy "Admins can insert courses"
  on courses for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- UPDATE
create policy "Admins can update courses"
  on courses for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- DELETE
create policy "Admins can delete courses"
  on courses for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── course_lessons ───────────────────────────

drop policy if exists "Admins can insert lessons"  on course_lessons;
drop policy if exists "Admins can update lessons"  on course_lessons;
drop policy if exists "Admins can delete lessons"  on course_lessons;

-- SELECT: anyone can read lessons of published courses
drop policy if exists "Anyone can view lessons of published courses" on course_lessons;
create policy "Anyone can view lessons of published courses"
  on course_lessons for select
  using (
    exists (
      select 1 from courses
      where id = course_lessons.course_id and is_published = true
    )
  );

-- SELECT: admins can read all lessons
drop policy if exists "Admins can view all lessons" on course_lessons;
create policy "Admins can view all lessons"
  on course_lessons for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- INSERT
create policy "Admins can insert lessons"
  on course_lessons for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- UPDATE
create policy "Admins can update lessons"
  on course_lessons for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- DELETE
create policy "Admins can delete lessons"
  on course_lessons for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );
