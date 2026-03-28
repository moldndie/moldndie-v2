-- ── Events RLS ────────────────────────────────────────────────
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "Public read access" ON events;
CREATE POLICY "Public read access"
ON events
FOR SELECT
USING (true);

-- Authenticated write
DROP POLICY IF EXISTS "Authenticated users can insert events" ON events;
CREATE POLICY "Authenticated users can insert events"
ON events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update events" ON events;
CREATE POLICY "Authenticated users can update events"
ON events
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete events" ON events;
CREATE POLICY "Authenticated users can delete events"
ON events
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- ── Suppliers RLS ─────────────────────────────────────────────
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "Public read access" ON suppliers;
CREATE POLICY "Public read access"
ON suppliers
FOR SELECT
USING (true);

-- Authenticated write
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON suppliers;
CREATE POLICY "Authenticated users can insert suppliers"
ON suppliers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON suppliers;
CREATE POLICY "Authenticated users can update suppliers"
ON suppliers
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON suppliers;
CREATE POLICY "Authenticated users can delete suppliers"
ON suppliers
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- ── Event categories RLS ──────────────────────────────────────
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON event_categories;
CREATE POLICY "Public read access"
ON event_categories
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage event categories" ON event_categories;
CREATE POLICY "Authenticated users can manage event categories"
ON event_categories
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ── Supplier categories RLS ───────────────────────────────────
ALTER TABLE supplier_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON supplier_categories;
CREATE POLICY "Public read access"
ON supplier_categories
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage supplier categories" ON supplier_categories;
CREATE POLICY "Authenticated users can manage supplier categories"
ON supplier_categories
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
