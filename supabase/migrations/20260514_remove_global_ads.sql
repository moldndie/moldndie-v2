-- Convert any ads that target 'global' to target all specific pages instead.
-- The 'global' option has been removed from the UI and query logic.

UPDATE ads
SET target_pages = ARRAY[
  'homepage', 'blog', 'academy', 'library', 'engineering', 'suppliers', 'events'
]
WHERE 'global' = ANY(target_pages);
