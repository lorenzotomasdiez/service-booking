-- BarberPro Database Initialization Script
-- This script sets up the initial database configuration

-- Create additional databases for testing
CREATE DATABASE barberpro_test;
CREATE DATABASE barberpro_staging;

-- Create development user with appropriate permissions
CREATE USER barberpro_dev WITH PASSWORD 'barberpro_dev_password';
GRANT ALL PRIVILEGES ON DATABASE barberpro_dev TO barberpro_dev;
GRANT ALL PRIVILEGES ON DATABASE barberpro_test TO barberpro_dev;
GRANT ALL PRIVILEGES ON DATABASE barberpro_staging TO barberpro_dev;

-- Enable necessary extensions
\c barberpro_dev;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c barberpro_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; 
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c barberpro_staging;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a function to update updated_at timestamps
\c barberpro_dev;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Switch to test database and create the same function
\c barberpro_test;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Switch to staging database and create the same function
\c barberpro_staging;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';