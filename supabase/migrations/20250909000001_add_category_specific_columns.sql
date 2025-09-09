-- Add category-specific columns to listings table
-- Phase 1: Safe migration with nullable columns

-- For Rent category fields
ALTER TABLE listings 
ADD COLUMN available_from DATE,
ADD COLUMN available_to DATE,
ADD COLUMN rental_period TEXT;

-- Job category fields
ALTER TABLE listings 
ADD COLUMN salary_min INTEGER,
ADD COLUMN salary_max INTEGER,
ADD COLUMN job_type TEXT,
ADD COLUMN company_name TEXT;

-- For Sale category fields  
ALTER TABLE listings 
ADD COLUMN condition TEXT;

-- Add indexes for performance on filterable fields (without CONCURRENTLY for local development)
CREATE INDEX idx_listings_available_from ON listings(available_from) WHERE available_from IS NOT NULL;
CREATE INDEX idx_listings_available_to ON listings(available_to) WHERE available_to IS NOT NULL;
CREATE INDEX idx_listings_salary_min ON listings(salary_min) WHERE salary_min IS NOT NULL;
CREATE INDEX idx_listings_salary_max ON listings(salary_max) WHERE salary_max IS NOT NULL;
CREATE INDEX idx_listings_job_type ON listings(job_type) WHERE job_type IS NOT NULL;
CREATE INDEX idx_listings_company_name ON listings(company_name) WHERE company_name IS NOT NULL;
CREATE INDEX idx_listings_condition ON listings(condition) WHERE condition IS NOT NULL;
CREATE INDEX idx_listings_rental_period ON listings(rental_period) WHERE rental_period IS NOT NULL;

-- Composite indexes for common filter combinations
CREATE INDEX idx_listings_job_filters ON listings(category, job_type, salary_min) WHERE category = 'job';
CREATE INDEX idx_listings_rent_filters ON listings(category, available_from, available_to, rental_period) WHERE category = 'for_rent';
CREATE INDEX idx_listings_sale_filters ON listings(category, condition, price) WHERE category = 'for_sale';

-- Comments for documentation
COMMENT ON COLUMN listings.available_from IS 'When rental property becomes available (for_rent category)';
COMMENT ON COLUMN listings.available_to IS 'When rental property availability ends (for_rent category)';
COMMENT ON COLUMN listings.rental_period IS 'Rental duration type: daily, weekly, monthly (for_rent category)';
COMMENT ON COLUMN listings.salary_min IS 'Minimum salary offered (job category)';
COMMENT ON COLUMN listings.salary_max IS 'Maximum salary offered (job category)';
COMMENT ON COLUMN listings.job_type IS 'Employment type: full-time, part-time, contract (job category)';
COMMENT ON COLUMN listings.company_name IS 'Hiring company name (job category)';
COMMENT ON COLUMN listings.condition IS 'Item condition: new, used, refurbished (for_sale category)';