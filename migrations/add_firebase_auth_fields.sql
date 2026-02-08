-- Add Firebase Authentication fields to the users table
DO $$
BEGIN
  -- Add firebase_uid column if it doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'firebase_uid') THEN
    ALTER TABLE users ADD COLUMN firebase_uid TEXT UNIQUE;
  END IF;

  -- Add email_verified column if it doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;