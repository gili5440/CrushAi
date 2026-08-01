-- Switch primary auth to phone + SMS code (Tinder-style) instead of email+password.
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ADD COLUMN phone text UNIQUE;
ALTER TYPE auth_provider ADD VALUE IF NOT EXISTS 'phone';

CREATE TABLE phone_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX phone_otps_phone_idx ON phone_otps (phone);
