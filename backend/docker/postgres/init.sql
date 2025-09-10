-- Initialize BarberPro database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone to Argentina
SET timezone = 'America/Argentina/Buenos_Aires';

-- Create initial database user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'barberpro') THEN
        CREATE USER barberpro WITH PASSWORD 'barberpro_dev_password';
    END IF;
END
$$;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE barberpro_dev TO barberpro;

-- Log initialization
SELECT 'BarberPro PostgreSQL database initialized successfully' as status;