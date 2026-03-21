ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_notnull ON users(LOWER(email)) WHERE email IS NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS local_token UUID UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_local_token ON users(local_token);
