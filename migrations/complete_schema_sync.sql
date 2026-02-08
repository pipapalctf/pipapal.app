-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  receiver_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Add all required columns to the users table
DO $$
BEGIN
  -- Role-specific fields - Organizations
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_type') THEN
    ALTER TABLE users ADD COLUMN organization_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_name') THEN
    ALTER TABLE users ADD COLUMN organization_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'contact_person_name') THEN
    ALTER TABLE users ADD COLUMN contact_person_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'contact_person_position') THEN
    ALTER TABLE users ADD COLUMN contact_person_position TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'contact_person_phone') THEN
    ALTER TABLE users ADD COLUMN contact_person_phone TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'contact_person_email') THEN
    ALTER TABLE users ADD COLUMN contact_person_email TEXT;
  END IF;

  -- Role-specific fields - Collectors & Recyclers
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_certified') THEN
    ALTER TABLE users ADD COLUMN is_certified BOOLEAN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'certification_details') THEN
    ALTER TABLE users ADD COLUMN certification_details TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'business_type') THEN
    ALTER TABLE users ADD COLUMN business_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'business_name') THEN
    ALTER TABLE users ADD COLUMN business_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'waste_specialization') THEN
    ALTER TABLE users ADD COLUMN waste_specialization TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'service_location') THEN
    ALTER TABLE users ADD COLUMN service_location TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'service_type') THEN
    ALTER TABLE users ADD COLUMN service_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'operating_hours') THEN
    ALTER TABLE users ADD COLUMN operating_hours TEXT;
  END IF;

  -- Common fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'onboarding_completed') THEN
    ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;