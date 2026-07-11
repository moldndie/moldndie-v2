-- ─────────────────────────────────────────────────────────────────────────
-- ad_views: track every ad impression per unique visitor (per-day dedup)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_views (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id       uuid        NOT NULL,
  visitor_id  text        NOT NULL,
  session_id  text,
  page_path   text,
  viewed_at   timestamptz NOT NULL DEFAULT now(),
  -- one impression per visitor per ad per calendar day
  CONSTRAINT ad_views_unique_daily UNIQUE (ad_id, visitor_id, (viewed_at::date))
);

CREATE INDEX IF NOT EXISTS idx_adv_ad_id     ON ad_views(ad_id);
CREATE INDEX IF NOT EXISTS idx_adv_visitor   ON ad_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_adv_viewed_at ON ad_views(viewed_at);

ALTER TABLE ad_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_views_insert" ON ad_views
  FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────
-- content_views: unique-visitor view tracking per content item
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_views (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id   text        NOT NULL,
  content_type text        NOT NULL,  -- 'blog' | 'course' | 'mold' | 'event' | 'calculator' | 'supplier' | 'service'
  content_id   text        NOT NULL,
  session_id   text,
  viewed_at    timestamptz NOT NULL DEFAULT now(),
  -- one view per visitor per content (refresh-proof; re-counted after 24 h)
  CONSTRAINT content_views_unique_daily UNIQUE (visitor_id, content_type, content_id, (viewed_at::date))
);

CREATE INDEX IF NOT EXISTS idx_cv_content  ON content_views(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_cv_visitor  ON content_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_cv_viewed   ON content_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_cv_type     ON content_views(content_type);

ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_views_insert" ON content_views
  FOR INSERT WITH CHECK (true);

-- SELECT permission for dashboard (anon can read aggregates via RPCs only)
CREATE POLICY "content_views_select_admin" ON content_views
  FOR SELECT USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────
-- RPC: upsert an ad impression (ON CONFLICT = skip duplicate)
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION track_ad_view(
  p_ad_id      uuid,
  p_visitor_id text,
  p_session_id text  DEFAULT NULL,
  p_page_path  text  DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO ad_views (ad_id, visitor_id, session_id, page_path)
  VALUES (p_ad_id, p_visitor_id, p_session_id, p_page_path)
  ON CONFLICT (ad_id, visitor_id, (viewed_at::date)) DO NOTHING;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- RPC: upsert a content view (ON CONFLICT = skip duplicate for today)
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION track_content_view(
  p_visitor_id   text,
  p_content_type text,
  p_content_id   text,
  p_session_id   text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO content_views (visitor_id, content_type, content_id, session_id)
  VALUES (p_visitor_id, p_content_type, p_content_id, p_session_id)
  ON CONFLICT (visitor_id, content_type, content_id, (viewed_at::date)) DO NOTHING;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- RPC: get total unique view count for a single content item
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_content_view_count(
  p_content_type text,
  p_content_id   text
) RETURNS bigint LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(DISTINCT visitor_id)
  FROM content_views
  WHERE content_type = p_content_type
    AND content_id   = p_content_id;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- RPC: top content by views for the dashboard
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_top_content_views(
  p_content_type text  DEFAULT NULL,
  p_limit        int   DEFAULT 10
) RETURNS TABLE(content_type text, content_id text, views bigint)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT content_type, content_id, COUNT(DISTINCT visitor_id) AS views
  FROM content_views
  WHERE (p_content_type IS NULL OR content_views.content_type = p_content_type)
  GROUP BY content_type, content_id
  ORDER BY views DESC
  LIMIT p_limit;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- RPC: ad analytics summary for dashboard
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_ad_analytics()
RETURNS TABLE(
  ad_id          uuid,
  total_views    bigint,
  unique_views   bigint,
  views_today    bigint,
  views_month    bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    ad_id,
    COUNT(*)                                                                      AS total_views,
    COUNT(DISTINCT visitor_id)                                                    AS unique_views,
    COUNT(*) FILTER (WHERE viewed_at::date = current_date)                        AS views_today,
    COUNT(*) FILTER (WHERE viewed_at >= date_trunc('month', current_timestamp))   AS views_month
  FROM ad_views
  GROUP BY ad_id
  ORDER BY unique_views DESC;
$$;
