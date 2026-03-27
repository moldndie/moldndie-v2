-- Enable RLS on blogs table (idempotent)
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Drop existing insert policy if any, then recreate
DROP POLICY IF EXISTS "Authenticated users can insert blogs" ON blogs;

CREATE POLICY "Authenticated users can insert blogs"
ON blogs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow authenticated users to update/delete their own blogs
DROP POLICY IF EXISTS "Owners can update blogs" ON blogs;
CREATE POLICY "Owners can update blogs"
ON blogs
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Owners can delete blogs" ON blogs;
CREATE POLICY "Owners can delete blogs"
ON blogs
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Allow anyone to read published blogs
DROP POLICY IF EXISTS "Anyone can read published blogs" ON blogs;
CREATE POLICY "Anyone can read published blogs"
ON blogs
FOR SELECT
USING (is_published = true);

-- Allow owners to read their own unpublished blogs
DROP POLICY IF EXISTS "Owners can read own blogs" ON blogs;
CREATE POLICY "Owners can read own blogs"
ON blogs
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);
