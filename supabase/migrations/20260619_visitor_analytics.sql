-- visitor_analytics: one row per unique anonymous visitor
CREATE TABLE IF NOT EXISTS visitor_analytics (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id      text        NOT NULL UNIQUE,
  first_visit_at  timestamptz NOT NULL DEFAULT now(),
  last_visit_at   timestamptz NOT NULL DEFAULT now(),
  visit_count     integer     NOT NULL DEFAULT 1,
  session_count   integer     NOT NULL DEFAULT 1,
  country         text,
  city            text,
  browser         text,
  os              text,
  device_type     text,
  language        text,
  timezone        text,
  referrer        text,
  landing_page    text,
  last_page       text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- page_analytics: one row per page view
CREATE TABLE IF NOT EXISTS page_analytics (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id  text        NOT NULL,
  page_path   text        NOT NULL,
  visited_at  timestamptz NOT NULL DEFAULT now(),
  session_id  text
);

ALTER TABLE visitor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_analytics    ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert (tracking) — no personal data stored
CREATE POLICY "visitor_analytics_insert" ON visitor_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "page_analytics_insert" ON page_analytics
  FOR INSERT WITH CHECK (true);

-- Indexes for dashboard query performance
CREATE INDEX IF NOT EXISTS idx_va_first_visit  ON visitor_analytics(first_visit_at);
CREATE INDEX IF NOT EXISTS idx_va_last_visit   ON visitor_analytics(last_visit_at);
CREATE INDEX IF NOT EXISTS idx_va_device       ON visitor_analytics(device_type);
CREATE INDEX IF NOT EXISTS idx_va_browser      ON visitor_analytics(browser);
CREATE INDEX IF NOT EXISTS idx_pa_path         ON page_analytics(page_path);
CREATE INDEX IF NOT EXISTS idx_pa_visited_at   ON page_analytics(visited_at);
CREATE INDEX IF NOT EXISTS idx_pa_visitor_id   ON page_analytics(visitor_id);
CREATE INDEX IF NOT EXISTS idx_pa_session_id   ON page_analytics(session_id);

-- RPC: upsert a visitor row with atomic visit_count increment
-- SECURITY DEFINER so it runs with owner privileges (bypasses RLS for the UPDATE)
CREATE OR REPLACE FUNCTION upsert_visitor_analytics(
  p_visitor_id    text,
  p_last_page     text,
  p_browser       text    DEFAULT NULL,
  p_os            text    DEFAULT NULL,
  p_device_type   text    DEFAULT NULL,
  p_language      text    DEFAULT NULL,
  p_timezone      text    DEFAULT NULL,
  p_referrer      text    DEFAULT NULL,
  p_is_new_session boolean DEFAULT false
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO visitor_analytics (
    visitor_id, landing_page, last_page,
    browser, os, device_type,
    language, timezone, referrer,
    visit_count, session_count
  ) VALUES (
    p_visitor_id, p_last_page, p_last_page,
    p_browser, p_os, p_device_type,
    p_language, p_timezone, p_referrer,
    1, 1
  )
  ON CONFLICT (visitor_id) DO UPDATE SET
    last_visit_at  = now(),
    last_page      = p_last_page,
    visit_count    = visitor_analytics.visit_count + 1,
    session_count  = visitor_analytics.session_count + (CASE WHEN p_is_new_session THEN 1 ELSE 0 END),
    updated_at     = now();
END;
$$;

-- RPC: aggregate visitor stats — called by admin service
CREATE OR REPLACE FUNCTION get_visitor_summary()
RETURNS TABLE(
  total_visitors   bigint,
  today_visitors   bigint,
  week_visitors    bigint,
  month_visitors   bigint,
  returning_visitors bigint,
  total_page_views bigint
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    (SELECT count(*)            FROM visitor_analytics)                                                               AS total_visitors,
    (SELECT count(*)            FROM visitor_analytics WHERE first_visit_at::date = current_date)                     AS today_visitors,
    (SELECT count(*)            FROM visitor_analytics WHERE first_visit_at >= date_trunc('week',  current_timestamp)) AS week_visitors,
    (SELECT count(*)            FROM visitor_analytics WHERE first_visit_at >= date_trunc('month', current_timestamp)) AS month_visitors,
    (SELECT count(*)            FROM visitor_analytics WHERE visit_count > 1)                                          AS returning_visitors,
    (SELECT count(*)            FROM page_analytics)                                                                  AS total_page_views;
$$;

-- RPC: top N pages by view count
CREATE OR REPLACE FUNCTION get_top_pages(p_limit int DEFAULT 10)
RETURNS TABLE(page_path text, views bigint) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT page_path, count(*) AS views
  FROM page_analytics
  GROUP BY page_path
  ORDER BY views DESC
  LIMIT p_limit;
$$;

-- RPC: top referrers
CREATE OR REPLACE FUNCTION get_top_referrers(p_limit int DEFAULT 10)
RETURNS TABLE(referrer text, visitors bigint) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT referrer, count(*) AS visitors
  FROM visitor_analytics
  WHERE referrer IS NOT NULL AND referrer <> ''
  GROUP BY referrer
  ORDER BY visitors DESC
  LIMIT p_limit;
$$;

-- RPC: visitor breakdown by device type
CREATE OR REPLACE FUNCTION get_visitor_devices()
RETURNS TABLE(device_type text, visitors bigint) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT coalesce(device_type, 'Unknown') AS device_type, count(*) AS visitors
  FROM visitor_analytics
  GROUP BY device_type
  ORDER BY visitors DESC;
$$;

-- RPC: visitor breakdown by browser
CREATE OR REPLACE FUNCTION get_visitor_browsers()
RETURNS TABLE(browser text, visitors bigint) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT coalesce(browser, 'Unknown') AS browser, count(*) AS visitors
  FROM visitor_analytics
  GROUP BY browser
  ORDER BY visitors DESC;
$$;

-- RPC: daily visitors for the past 30 days (sparkline data)
CREATE OR REPLACE FUNCTION get_daily_visitors(p_days int DEFAULT 30)
RETURNS TABLE(day date, visitors bigint) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    generate_series(
      current_date - (p_days - 1) * interval '1 day',
      current_date,
      interval '1 day'
    )::date AS day,
    count(va.visitor_id) AS visitors
  FROM generate_series(
    current_date - (p_days - 1) * interval '1 day',
    current_date,
    interval '1 day'
  ) gs(day)
  LEFT JOIN visitor_analytics va
    ON va.first_visit_at::date = gs.day::date
  GROUP BY gs.day
  ORDER BY gs.day;
$$;
