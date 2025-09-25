-- Table: urls
CREATE TABLE IF NOT EXISTS urls (
  id SERIAL PRIMARY KEY,
  short_id VARCHAR(64) NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  user_id VARCHAR(128),
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_urls_short_id ON urls (short_id);
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls (created_at DESC);
