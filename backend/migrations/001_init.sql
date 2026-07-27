-- CrushAI initial schema
-- Requires the pgvector extension (CREATE EXTENSION vector;)

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

CREATE TYPE auth_provider AS ENUM ('email', 'google', 'apple');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE smoking_habit AS ENUM ('never', 'sometimes', 'regularly');
CREATE TYPE interaction_type AS ENUM ('view', 'save', 'like', 'pass', 'chat_request');
CREATE TYPE match_status AS ENUM ('active', 'unmatched');
CREATE TYPE report_status AS ENUM ('open', 'reviewed', 'actioned');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text,
  auth_provider auth_provider NOT NULL DEFAULT 'email',
  created_at timestamptz NOT NULL DEFAULT now(),
  is_verified boolean NOT NULL DEFAULT false,
  is_banned boolean NOT NULL DEFAULT false,
  role user_role NOT NULL DEFAULT 'user',
  terms_accepted_at timestamptz
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  birth_date date NOT NULL,
  gender text NOT NULL,
  interested_in text NOT NULL,
  bio text,
  profession text,
  education text,
  looking_for text,
  region text,
  latitude double precision,
  longitude double precision,
  height_cm int,
  religion text,
  smoking smoking_habit,
  lifestyle_tags text[] NOT NULL DEFAULT '{}',
  visible_in_ai_search boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE profile_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_url text NOT NULL,
  embedding vector(512),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inspiration_photo_url text,
  embedding vector(512),
  filters_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type interaction_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  status match_status NOT NULL DEFAULT 'active',
  UNIQUE(user_a_id, user_b_id)
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text,
  media_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status report_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL DEFAULT 'free',
  provider_subscription_id text,
  current_period_end timestamptz,
  status subscription_status NOT NULL DEFAULT 'active',
  UNIQUE(user_id)
);

CREATE INDEX profile_photos_embedding_idx ON profile_photos
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX profiles_visible_idx ON profiles (visible_in_ai_search);
CREATE INDEX interactions_user_idx ON interactions (user_id);
CREATE INDEX messages_match_idx ON messages (match_id, created_at);
