ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token UUID;
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token);

-- All existing users are trusted and should not be locked out
UPDATE users SET email_verified = true;
