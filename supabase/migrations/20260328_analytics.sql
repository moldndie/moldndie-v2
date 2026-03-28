-- ── Page Views ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  path       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can insert
DROP POLICY IF EXISTS "Anyone can insert page views" ON page_views;
CREATE POLICY "Anyone can insert page views"
ON page_views FOR INSERT
WITH CHECK (true);

-- Only service role reads (dashboard uses admin client)
DROP POLICY IF EXISTS "No direct select" ON page_views;
CREATE POLICY "No direct select"
ON page_views FOR SELECT
USING (false);

-- ── Revenue Events ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenue_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id   uuid NOT NULL,
  amount     numeric(10,2) NOT NULL,
  type       text NOT NULL CHECK (type IN ('course', 'mold')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (webhook + dashboard use admin client)
DROP POLICY IF EXISTS "No direct access" ON revenue_events;
CREATE POLICY "No direct access"
ON revenue_events FOR ALL
USING (false);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON page_views (created_at);
CREATE INDEX IF NOT EXISTS revenue_events_created_at_idx ON revenue_events (created_at);
