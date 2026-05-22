-- Global custom quotes (admin-managed, public read)
CREATE TABLE IF NOT EXISTS custom_quotes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text        TEXT NOT NULL,
  translation TEXT,
  source      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE custom_quotes ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read — needed for login/signup pages
CREATE POLICY "Public read"
  ON custom_quotes FOR SELECT
  USING (true);

-- Only authenticated users (admin) can insert/delete
CREATE POLICY "Authenticated write"
  ON custom_quotes FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
