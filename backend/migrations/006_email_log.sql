CREATE TABLE IF NOT EXISTS email_send_errors (
  id SERIAL PRIMARY KEY,
  recipient VARCHAR(320) NOT NULL,
  subject TEXT,
  error_message TEXT NOT NULL,
  error_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_send_errors_created_at ON email_send_errors(created_at DESC);

CREATE TABLE IF NOT EXISTS admin_config (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
