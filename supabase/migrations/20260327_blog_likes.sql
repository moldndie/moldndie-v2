CREATE TABLE IF NOT EXISTS blog_likes (
  blog_id uuid NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blog_id, user_id)
);

ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read likes" ON blog_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert their own like" ON blog_likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own like" ON blog_likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
