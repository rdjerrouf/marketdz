-- Add exec function for running raw SQL (development only)
-- This is needed for the mock data generator

CREATE OR REPLACE FUNCTION exec(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;