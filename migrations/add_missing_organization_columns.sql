-- Add missing organization-related columns to users table
DO $$
BEGIN
  -- organization_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'organization_name'
  ) THEN
    ALTER TABLE users ADD COLUMN organization_name TEXT;
  END IF;

  -- contact_person_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'contact_person_name'
  ) THEN
    ALTER TABLE users ADD COLUMN contact_person_name TEXT;
  END IF;

  -- contact_person_position column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'contact_person_position'
  ) THEN
    ALTER TABLE users ADD COLUMN contact_person_position TEXT;
  END IF;

  -- contact_person_phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'contact_person_phone'
  ) THEN
    ALTER TABLE users ADD COLUMN contact_person_phone TEXT;
  END IF;

  -- contact_person_email column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'contact_person_email'
  ) THEN
    ALTER TABLE users ADD COLUMN contact_person_email TEXT;
  END IF;

  -- is_certified column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_certified'
  ) THEN
    ALTER TABLE users ADD COLUMN is_certified BOOLEAN;
  END IF;

  -- certification_details column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'certification_details'
  ) THEN
    ALTER TABLE users ADD COLUMN certification_details TEXT;
  END IF;

  -- business_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'business_type'
  ) THEN
    ALTER TABLE users ADD COLUMN business_type TEXT;
  END IF;

  -- business_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE users ADD COLUMN business_name TEXT;
  END IF;

  -- waste_specialization column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'waste_specialization'
  ) THEN
    ALTER TABLE users ADD COLUMN waste_specialization TEXT[];
  END IF;

  -- service_location column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'service_location'
  ) THEN
    ALTER TABLE users ADD COLUMN service_location TEXT;
  END IF;

  -- service_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'service_type'
  ) THEN
    ALTER TABLE users ADD COLUMN service_type TEXT;
  END IF;

  -- operating_hours column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'operating_hours'
  ) THEN
    ALTER TABLE users ADD COLUMN operating_hours TEXT;
  END IF;

  -- onboarding_completed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;