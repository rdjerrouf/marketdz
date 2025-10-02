-- Create 10 test users with SQL
-- Run with: docker exec supabase_db_marketdz psql -U postgres -d postgres -f scripts/create-test-users-sql.sql

DO $$
DECLARE
  user_id uuid;
  i int;
  wilayas text[] := ARRAY['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida'];
  cities text[] := ARRAY['Bab Ezzouar', 'Es Senia', 'Constantine Centre', 'Annaba Centre', 'Blida Centre'];
  categories text[] := ARRAY['for_sale', 'job', 'service', 'for_rent'];
  cat text;
  j int;
  photo_num int;
  listing_count int := 0;
BEGIN
  -- Create 10 test users
  FOR i IN 1..10 LOOP
    user_id := gen_random_uuid();

    -- Insert into auth.users
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role, aud,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, reauthentication_token, phone_change, phone_change_token
    ) VALUES (
      user_id,
      '00000000-0000-0000-0000-000000000000',
      'test' || i || '@example.com',
      crypt('test123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      ('{"first_name":"Test' || i || '","last_name":"User"}')::jsonb,
      false,
      'authenticated',
      'authenticated',
      '', '', '', '', '', '', ''
    );

    -- Profile is created automatically by trigger

    RAISE NOTICE 'Created user: test%@example.com', i;

    -- Create 5 listings per category (20 total per user)
    FOREACH cat IN ARRAY categories LOOP
      FOR j IN 1..5 LOOP
        photo_num := ((listing_count % 5) + 1);

        INSERT INTO listings (
          user_id,
          category,
          title,
          description,
          price,
          status,
          location_city,
          location_wilaya,
          photos,
          condition,
          salary_min,
          salary_max,
          job_type,
          company_name,
          rental_period,
          available_from,
          available_to
        ) VALUES (
          user_id,
          cat::listing_category,
          CASE cat
            WHEN 'for_sale' THEN 'منتج للبيع ' || j
            WHEN 'job' THEN 'وظيفة متاحة ' || j
            WHEN 'service' THEN 'خدمة احترافية ' || j
            WHEN 'for_rent' THEN 'عقار للإيجار ' || j
          END,
          'وصف تفصيلي باللغة العربية مع بعض الكلمات الإنجليزية رقم ' || j,
          CASE WHEN cat IN ('for_sale', 'for_rent') THEN (5000 + (j * 1000)) ELSE NULL END,
          'active',
          cities[((i - 1) % 5) + 1],
          wilayas[((i - 1) % 5) + 1],
          ARRAY['/uploads/photo' || photo_num || '.jpg'],
          CASE WHEN cat = 'for_sale' THEN (CASE WHEN j % 2 = 0 THEN 'new' ELSE 'used' END) ELSE NULL END,
          CASE WHEN cat = 'job' THEN (30000 + (j * 5000)) ELSE NULL END,
          CASE WHEN cat = 'job' THEN (50000 + (j * 10000)) ELSE NULL END,
          CASE WHEN cat = 'job' THEN (CASE WHEN j % 2 = 0 THEN 'full-time' ELSE 'part-time' END) ELSE NULL END,
          CASE WHEN cat = 'job' THEN ('شركة الاختبار ' || j) ELSE NULL END,
          CASE WHEN cat = 'for_rent' THEN (CASE WHEN j % 3 = 0 THEN 'daily' WHEN j % 3 = 1 THEN 'monthly' ELSE 'yearly' END) ELSE NULL END,
          CASE WHEN cat = 'for_rent' THEN CURRENT_DATE ELSE NULL END,
          CASE WHEN cat = 'for_rent' THEN (CURRENT_DATE + INTERVAL '6 months') ELSE NULL END
        );

        listing_count := listing_count + 1;
      END LOOP;
    END LOOP;

    RAISE NOTICE 'Created 20 listings for test%@example.com', i;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Created 10 users with % listings total', listing_count;
END $$;

-- Verify creation
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE email LIKE 'test%@example.com') as test_users
FROM profiles;

SELECT
  COUNT(*) as total_listings,
  category,
  COUNT(*) as count_per_category
FROM listings
GROUP BY category
ORDER BY category;
