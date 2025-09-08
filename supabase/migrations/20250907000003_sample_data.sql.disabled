-- Sample Data for Performance Testing
-- This creates realistic test data to demonstrate index performance

-- First, let's check if we have users to associate listings with
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM profiles;
    
    IF user_count = 0 THEN
        RAISE NOTICE 'No users found. Creating a test user first.';
        -- Create a test user if none exists
        INSERT INTO profiles (id, email, first_name, last_name, created_at)
        VALUES (
            uuid_generate_v4(),
            'testuser@marketdz.com',
            'Test',
            'User',
            NOW()
        );
    END IF;
END $$;

-- Insert 1000 sample listings with realistic data
INSERT INTO listings (
    id,
    user_id,
    category,
    title,
    description,
    price,
    location_wilaya,
    location_city,
    status,
    created_at,
    updated_at
)
SELECT 
    uuid_generate_v4(),
    (SELECT id FROM profiles ORDER BY random() LIMIT 1), -- Random existing user
    (ARRAY['for_sale', 'for_rent', 'service', 'job'])[floor(random() * 4 + 1)]::listing_category,
    CASE 
        WHEN floor(random() * 4 + 1) = 1 THEN 'Voiture ' || (ARRAY['Toyota', 'Renault', 'Peugeot', 'Hyundai', 'Kia'])[floor(random() * 5 + 1)] || ' ' || (2010 + floor(random() * 14))
        WHEN floor(random() * 4 + 1) = 2 THEN 'Appartement ' || (1 + floor(random() * 5)) || ' pièces à ' || (ARRAY['Alger', 'Oran', 'Constantine', 'Blida'])[floor(random() * 4 + 1)]
        WHEN floor(random() * 4 + 1) = 3 THEN (ARRAY['Réparation', 'Nettoyage', 'Livraison', 'Cours', 'Consultation'])[floor(random() * 5 + 1)] || ' professionnel'
        ELSE (ARRAY['Ingénieur', 'Comptable', 'Professeur', 'Vendeur', 'Technicien'])[floor(random() * 5 + 1)] || ' recherché'
    END,
    CASE 
        WHEN floor(random() * 4 + 1) = 1 THEN 'Voiture en excellent état, bien entretenue, tous papiers en règle.'
        WHEN floor(random() * 4 + 1) = 2 THEN 'Appartement spacieux, bien situé, proche des commodités.'
        WHEN floor(random() * 4 + 1) = 3 THEN 'Service professionnel de qualité, disponible 7j/7.'
        ELSE 'Poste intéressant avec possibilités d''évolution.'
    END,
    CASE 
        WHEN floor(random() * 4 + 1) = 1 THEN (500000 + floor(random() * 2000000))::numeric -- Cars: 500k to 2.5M
        WHEN floor(random() * 4 + 1) = 2 THEN (20000 + floor(random() * 100000))::numeric   -- Rent: 20k to 120k
        WHEN floor(random() * 4 + 1) = 3 THEN (1000 + floor(random() * 50000))::numeric     -- Services: 1k to 51k
        ELSE (30000 + floor(random() * 200000))::numeric                                     -- Jobs: 30k to 230k
    END,
    (ARRAY['Alger', 'Oran', 'Constantine', 'Blida', 'Sétif', 'Annaba', 'Batna', 'Djelfa', 'Sidi Bel Abbès', 'Biskra'])[floor(random() * 10 + 1)],
    CASE 
        WHEN floor(random() * 10 + 1) <= 3 THEN 'Alger Centre'
        WHEN floor(random() * 10 + 1) <= 6 THEN 'Oran Centre'  
        ELSE (ARRAY['Constantine Centre', 'Blida Centre', 'Sétif Centre', 'Annaba Centre'])[floor(random() * 4 + 1)]
    END,
    (ARRAY['active', 'active', 'active', 'sold', 'expired'])[floor(random() * 5 + 1)]::listing_status, -- 60% active
    NOW() - (random() * interval '60 days'), -- Random date in last 60 days
    NOW() - (random() * interval '30 days')  -- Updated within last 30 days
FROM generate_series(1, 1000);

-- Add some sample favorites to test favorites functionality
INSERT INTO favorites (user_id, listing_id, created_at)
SELECT 
    (SELECT id FROM profiles ORDER BY random() LIMIT 1),
    l.id,
    NOW() - (random() * interval '30 days')
FROM listings l 
WHERE l.status = 'active'
ORDER BY random() 
LIMIT 200; -- 200 random favorites

-- Add some sample reviews to test ratings
INSERT INTO reviews (
    id,
    reviewer_id,
    reviewed_id,
    rating,
    comment,
    created_at
)
SELECT 
    uuid_generate_v4(),
    (SELECT id FROM profiles ORDER BY random() LIMIT 1),
    (SELECT id FROM profiles ORDER BY random() LIMIT 1),
    (1 + floor(random() * 5))::INTEGER, -- Rating 1-5
    CASE floor(random() * 5 + 1)
        WHEN 1 THEN 'Excellent vendeur, très professionnel!'
        WHEN 2 THEN 'Transaction rapide et sans problème.'
        WHEN 3 THEN 'Bon contact, produit conforme à la description.'
        WHEN 4 THEN 'Service satisfaisant, je recommande.'
        ELSE 'Très bonne expérience d''achat.'
    END,
    NOW() - (random() * interval '90 days')
FROM generate_series(1, 150);

-- Update table statistics to help query planner
ANALYZE listings;
ANALYZE favorites; 
ANALYZE reviews;
ANALYZE profiles;

-- Show summary of created data
SELECT 
    'Listings' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE status = 'active') as active_count,
    COUNT(*) FILTER (WHERE category = 'for_sale') as for_sale_count,
    COUNT(*) FILTER (WHERE location_wilaya = 'Alger') as alger_count
FROM listings

UNION ALL

SELECT 
    'Favorites' as table_name,
    COUNT(*) as total_rows,
    NULL as active_count,
    NULL as for_sale_count, 
    NULL as alger_count
FROM favorites

UNION ALL

SELECT 
    'Reviews' as table_name,
    COUNT(*) as total_rows,
    AVG(rating)::INTEGER as avg_rating,
    NULL as for_sale_count,
    NULL as alger_count
FROM reviews

UNION ALL

SELECT 
    'Profiles' as table_name,
    COUNT(*) as total_rows,
    NULL as active_count,
    NULL as for_sale_count,
    NULL as alger_count
FROM profiles;
