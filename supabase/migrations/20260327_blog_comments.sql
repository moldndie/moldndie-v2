CREATE TABLE IF NOT EXISTS blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments" ON blog_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert their own comment" ON blog_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment" ON blog_comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
