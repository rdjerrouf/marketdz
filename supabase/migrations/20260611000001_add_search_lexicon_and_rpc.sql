-- Phase 1 of cross-language search plan (docs/DAILY_TASK.md, 2026-06-11):
-- trilingual synonym expansion at query time + one search RPC.
--
--  1. search_lexicon        — concept groups (FR/EN/MSA/Darija/Arabizi spellings)
--  2. build_search_tsqueries — token → expanded AND-of-OR tsquery pair (ar/fr)
--  3. search_listings_v2     — single RPC: expansion + all browse filters + ranking
--  4. seed: vehicles, auto parts, construction + high-traffic generics
--
-- Design notes (from the external-review amendments in DAILY_TASK.md):
--  * Lexicon terms are stored lowercase + normalize_arabic()-normalized AT INSERT,
--    so dictionary entries can never drift from how search_vector_ar was built.
--  * plainto_tsquery() per variant — injection-proof, no quote_literal games.
--  * One OR-group per user token, groups ANDed (preserves multi-word semantics).
--  * Query-side Arabic normalization fixes the latent bug where أ/ا or ى/ي
--    variants typed by users never matched the normalized vector.
--  * ts_rank_cd only computed when p_sort = 'relevance' (avoids per-row CPU
--    on price/date sorts — BUDGET_WATCHLIST.md watch item).

-- ── 1. Lexicon table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.search_lexicon (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  terms text[] NOT NULL,           -- all equivalent spellings, one row per concept
  category text,                   -- curation label only (e.g. 'vehicles')
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_lexicon_terms_gin
  ON public.search_lexicon USING GIN (terms)
  WHERE is_active;

ALTER TABLE public.search_lexicon ENABLE ROW LEVEL SECURITY;

-- Read path is exclusively the RPC executed via the service-role client.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.search_lexicon TO service_role;

-- ── 2. tsquery builder ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.build_search_tsqueries(
  p_search text,
  p_max_tokens int DEFAULT 6,
  p_max_expansions int DEFAULT 8
)
RETURNS TABLE(q_ar tsquery, q_fr tsquery)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_tokens   text[];
  v_token    text;
  v_variants text[];
  v_variant  text;
  v_part     tsquery;
  v_group_ar tsquery;
  v_group_fr tsquery;
  v_all_ar   tsquery := NULL;
  v_all_fr   tsquery := NULL;
BEGIN
  -- Tokenize: lowercase, punctuation → space, drop 1-char tokens, cap count
  SELECT array_agg(t) INTO v_tokens FROM (
    SELECT t
    FROM unnest(regexp_split_to_array(
      trim(regexp_replace(lower(coalesce(p_search, '')), '[^[:alnum:][:space:]]+', ' ', 'g')),
      '\s+')) AS t
    WHERE length(t) >= 2
    LIMIT greatest(1, p_max_tokens)
  ) s;

  IF v_tokens IS NULL THEN
    RETURN QUERY SELECT NULL::tsquery, NULL::tsquery;
    RETURN;
  END IF;

  FOREACH v_token IN ARRAY v_tokens LOOP
    -- Expand token via lexicon (lookup key normalized the same way terms were stored)
    SELECT array_agg(v) INTO v_variants FROM (
      SELECT v FROM (
        SELECT DISTINCT v FROM (
          SELECT v_token AS v
          UNION ALL
          SELECT t
          FROM public.search_lexicon l, unnest(l.terms) AS t
          WHERE l.is_active
            AND l.terms @> ARRAY[lower(trim(public.normalize_arabic(v_token)))]
        ) raw
        WHERE length(v) >= 2
      ) ded
      ORDER BY (v = v_token) DESC, v     -- original token always survives the cap
      LIMIT greatest(1, p_max_expansions)
    ) lim;

    v_group_ar := NULL;
    v_group_fr := NULL;

    FOREACH v_variant IN ARRAY v_variants LOOP
      -- AR side matches the vector built from normalize_arabic()'d text
      v_part := plainto_tsquery('arabic', public.normalize_arabic(v_variant));
      IF v_part IS NOT NULL AND numnode(v_part) > 0 THEN
        v_group_ar := CASE WHEN v_group_ar IS NULL THEN v_part ELSE v_group_ar || v_part END;
      END IF;

      v_part := plainto_tsquery('french', v_variant);
      IF v_part IS NOT NULL AND numnode(v_part) > 0 THEN
        v_group_fr := CASE WHEN v_group_fr IS NULL THEN v_part ELSE v_group_fr || v_part END;
      END IF;
    END LOOP;

    -- AND this token's OR-group into the running query (per vector)
    IF v_group_ar IS NOT NULL THEN
      v_all_ar := CASE WHEN v_all_ar IS NULL THEN v_group_ar ELSE v_all_ar && v_group_ar END;
    END IF;
    IF v_group_fr IS NOT NULL THEN
      v_all_fr := CASE WHEN v_all_fr IS NULL THEN v_group_fr ELSE v_all_fr && v_group_fr END;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_all_ar, v_all_fr;
END;
$$;

-- ── 3. Search RPC ────────────────────────────────────────────────────────────
-- Mirrors every filter of GET /api/search. Detail-key allowlisting stays in the
-- route; p_details (containment) / p_details_text (ILIKE) arrive pre-validated.

CREATE OR REPLACE FUNCTION public.search_listings_v2(
  p_query text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_subcategory text DEFAULT NULL,
  p_wilaya text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_available_from date DEFAULT NULL,
  p_available_to date DEFAULT NULL,
  p_rental_period text DEFAULT NULL,
  p_min_salary numeric DEFAULT NULL,
  p_max_salary numeric DEFAULT NULL,
  p_job_type text DEFAULT NULL,
  p_company_name text DEFAULT NULL,
  p_condition text DEFAULT NULL,
  p_vehicle_make text DEFAULT NULL,
  p_vehicle_transmission text DEFAULT NULL,
  p_vehicle_fuel_type text DEFAULT NULL,
  p_vehicle_year_min int DEFAULT NULL,
  p_vehicle_year_max int DEFAULT NULL,
  p_vehicle_mileage_max int DEFAULT NULL,
  p_details jsonb DEFAULT NULL,
  p_details_text jsonb DEFAULT NULL,
  p_sort text DEFAULT 'relevance',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid, title text, description text, price numeric,
  category public.listing_category, subcategory text,
  created_at timestamptz, status public.listing_status, user_id uuid,
  location_wilaya text, location_city text, photos text[], condition text,
  available_from date, available_to date, rental_period text,
  salary_min integer, salary_max integer, job_type text, company_name text,
  favorites_count integer, views_count integer,
  vehicle_make text, vehicle_model text, vehicle_year smallint,
  vehicle_mileage integer, vehicle_transmission text, vehicle_fuel_type text,
  vehicle_body_type text, listing_details jsonb,
  rank real
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
SELECT * FROM (
  SELECT
    l.id, l.title, l.description, l.price, l.category, l.subcategory,
    l.created_at, l.status, l.user_id, l.location_wilaya, l.location_city,
    l.photos, l.condition, l.available_from, l.available_to, l.rental_period,
    l.salary_min, l.salary_max, l.job_type, l.company_name,
    l.favorites_count, l.views_count,
    l.vehicle_make, l.vehicle_model, l.vehicle_year, l.vehicle_mileage,
    l.vehicle_transmission, l.vehicle_fuel_type, l.vehicle_body_type,
    l.listing_details,
    (CASE
       WHEN p_sort = 'relevance' AND (q.q_ar IS NOT NULL OR q.q_fr IS NOT NULL) THEN
         coalesce(ts_rank_cd(l.search_vector_fr, q.q_fr), 0)
         + coalesce(ts_rank_cd(l.search_vector_ar, q.q_ar), 0)
       ELSE 0
     END)::real AS rank
  FROM public.listings l
  CROSS JOIN public.build_search_tsqueries(p_query) AS q
  WHERE l.status = 'active'
    AND (p_category IS NULL OR l.category = p_category::public.listing_category)
    AND (p_subcategory IS NULL OR l.subcategory = p_subcategory)
    AND (p_wilaya IS NULL OR l.location_wilaya = p_wilaya)
    AND (p_city IS NULL OR l.location_city = p_city)
    AND (p_min_price IS NULL OR l.price >= p_min_price)
    AND (p_max_price IS NULL OR l.price <= p_max_price)
    AND (p_available_from IS NULL OR l.available_from >= p_available_from)
    AND (p_available_to IS NULL OR l.available_to <= p_available_to)
    AND (p_rental_period IS NULL OR l.rental_period = p_rental_period)
    AND (p_min_salary IS NULL OR l.salary_min >= p_min_salary)
    AND (p_max_salary IS NULL OR l.salary_max <= p_max_salary)
    AND (p_job_type IS NULL OR l.job_type = p_job_type)
    AND (p_company_name IS NULL OR l.company_name ILIKE '%' || p_company_name || '%')
    AND (p_condition IS NULL OR l.condition = p_condition)
    AND (p_vehicle_make IS NULL OR NOT EXISTS (
          SELECT 1 FROM unnest(string_to_array(trim(p_vehicle_make), ' ')) AS tk
          WHERE tk <> ''
            AND NOT (l.vehicle_make ILIKE '%' || tk || '%'
                     OR l.vehicle_model ILIKE '%' || tk || '%')))
    AND (p_vehicle_transmission IS NULL OR l.vehicle_transmission = p_vehicle_transmission)
    AND (p_vehicle_fuel_type IS NULL OR l.vehicle_fuel_type = p_vehicle_fuel_type)
    AND (p_vehicle_year_min IS NULL OR l.vehicle_year >= p_vehicle_year_min)
    AND (p_vehicle_year_max IS NULL OR l.vehicle_year <= p_vehicle_year_max)
    AND (p_vehicle_mileage_max IS NULL OR l.vehicle_mileage <= p_vehicle_mileage_max)
    AND (p_details IS NULL OR l.listing_details @> p_details)
    AND (p_details_text IS NULL OR NOT EXISTS (
          SELECT 1 FROM jsonb_each_text(p_details_text) AS f(k, v)
          WHERE l.listing_details->>f.k IS NULL
             OR l.listing_details->>f.k NOT ILIKE '%' || f.v || '%'))
    AND (
      (q.q_ar IS NULL AND q.q_fr IS NULL)
      OR (q.q_ar IS NOT NULL AND l.search_vector_ar @@ q.q_ar)
      OR (q.q_fr IS NOT NULL AND l.search_vector_fr @@ q.q_fr)
    )
) s
ORDER BY
  CASE WHEN p_sort = 'price_low'  THEN s.price END ASC NULLS LAST,
  CASE WHEN p_sort = 'price_high' THEN s.price END DESC NULLS LAST,
  CASE WHEN p_sort = 'oldest'     THEN s.created_at END ASC,
  CASE WHEN p_sort = 'relevance'  THEN s.rank END DESC,
  s.created_at DESC, s.id DESC
LIMIT greatest(1, least(coalesce(p_limit, 20), 50))
OFFSET greatest(coalesce(p_offset, 0), 0)
$$;

-- Only the service-role search API may execute (route enforces param allowlists).
REVOKE EXECUTE ON FUNCTION public.build_search_tsqueries(text, int, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.search_listings_v2(text, text, text, text, text, numeric, numeric, date, date, text, numeric, numeric, text, text, text, text, text, text, int, int, int, jsonb, jsonb, text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.build_search_tsqueries(text, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.search_listings_v2(text, text, text, text, text, numeric, numeric, date, date, text, numeric, numeric, text, text, text, text, text, text, int, int, int, jsonb, jsonb, text, int, int) TO service_role;

-- ── 4. Seed lexicon ──────────────────────────────────────────────────────────
-- Terms normalized at insert via normalize_arabic() + lower(), so they always
-- match the vector pipeline. Scope v1: vehicles + parts + construction
-- (densest categories) + high-traffic generics. Grows from search_zero_results.

INSERT INTO public.search_lexicon (terms, category)
SELECT
  (SELECT array_agg(DISTINCT lower(trim(public.normalize_arabic(t))))
     FROM unnest(v.terms) AS t),
  v.cat
FROM (VALUES
  -- vehicles
  (ARRAY['voiture','voitures','car','cars','سيارة','سيارات','طوموبيل','طونوبيل','tomobile','tonobile'], 'vehicles'),
  (ARRAY['moto','motos','motorcycle','motocyclette','دراجة نارية','موطو','متور'], 'vehicles'),
  (ARRAY['camion','camions','truck','شاحنة','شاحنات','كاميون'], 'vehicles'),
  (ARRAY['velo','vélo','bicyclette','bicycle','bike','دراجة','بيسكلات'], 'vehicles'),
  (ARRAY['occasion','used','مستعمل','مستعملة'], 'vehicles'),
  -- auto parts
  (ARRAY['frein','freins','brake','brakes','فرامل','فرينات','فران'], 'auto_parts'),
  (ARRAY['pneu','pneus','tire','tires','tyre','tyres','إطار','إطارات','عجلات','بنو'], 'auto_parts'),
  (ARRAY['moteur','moteurs','engine','محرك','محركات','موتور'], 'auto_parts'),
  (ARRAY['boite vitesse','boîte vitesses','gearbox','transmission','علبة السرعة','بواط دفيتاس'], 'auto_parts'),
  (ARRAY['phare','phares','headlight','headlights','مصباح','مصابيح','فار'], 'auto_parts'),
  (ARRAY['batterie','batteries','battery','بطارية','بطاريات','باتري'], 'auto_parts'),
  (ARRAY['amortisseur','amortisseurs','shock absorber','مساعد','مساعدات'], 'auto_parts'),
  (ARRAY['jante','jantes','rim','rims','جنط','جنوط'], 'auto_parts'),
  (ARRAY['pare chocs','parechoc','bumper','صدام','صدامات'], 'auto_parts'),
  (ARRAY['capot','hood','bonnet','كابو'], 'auto_parts'),
  (ARRAY['retroviseur','rétroviseur','mirror','مرآة','مراية','ريترو'], 'auto_parts'),
  (ARRAY['embrayage','clutch','ديسك','دسك'], 'auto_parts'),
  (ARRAY['radiateur','radiator','مبرد','راديتور'], 'auto_parts'),
  (ARRAY['piece','pièces','pieces rechange','spare part','spare parts','قطع غيار','قطع','بياس'], 'auto_parts'),
  -- construction
  (ARRAY['ciment','cement','إسمنت','اسمنت','سيمة'], 'construction'),
  (ARRAY['brique','briques','brick','bricks','طوب','بريك'], 'construction'),
  (ARRAY['fer beton','fer a beton','rebar','حديد','حديد البناء','فير'], 'construction'),
  (ARRAY['bois','wood','timber','خشب'], 'construction'),
  (ARRAY['carrelage','tiles','tile','زليج','بلاط','كارلاج'], 'construction'),
  (ARRAY['peinture','paint','دهان','صباغة'], 'construction'),
  (ARRAY['sable','sand','رمل'], 'construction'),
  (ARRAY['gravier','gravel','حصى','جرافي'], 'construction'),
  (ARRAY['betonniere','bétonnière','concrete mixer','خلاطة','خلاطة اسمنت'], 'construction'),
  (ARRAY['echafaudage','échafaudage','scaffolding','سقالة','سقالات'], 'construction'),
  (ARRAY['pelle','excavatrice','excavator','حفارة','بيل ميكانيك'], 'construction'),
  (ARRAY['grue','crane','رافعة'], 'construction'),
  (ARRAY['tracteur','tractor','جرار','تراكتور'], 'construction'),
  -- high-traffic generics
  (ARRAY['appartement','apartment','flat','شقة','أبارتمون'], 'real_estate'),
  (ARRAY['maison','house','villa','منزل','بيت','دار','فيلا'], 'real_estate'),
  (ARRAY['terrain','land','plot','أرض','أرضية','قطعة أرض'], 'real_estate'),
  (ARRAY['location','rent','rental','كراء','إيجار','للكراء'], 'real_estate'),
  (ARRAY['vente','sale','بيع','للبيع'], 'real_estate'),
  (ARRAY['telephone','téléphone','phone','smartphone','portable','هاتف','تليفون','بورطابل'], 'electronics'),
  (ARRAY['ordinateur','computer','laptop','pc','حاسوب','كمبيوتر','ميكرو'], 'electronics'),
  (ARRAY['television','télévision','tv','تلفاز','تلفزيون','تيلي'], 'electronics'),
  (ARRAY['refrigerateur','réfrigérateur','frigo','fridge','refrigerator','ثلاجة','تلاجة','فريجيدار'], 'appliances'),
  (ARRAY['climatiseur','clim','air conditioner','مكيف','كليماتيزور'], 'appliances'),
  (ARRAY['machine laver','lave linge','washing machine','غسالة','ماشينة'], 'appliances'),
  (ARRAY['cuisiniere','cuisinière','stove','cooker','طباخة','كوزينيار'], 'appliances'),
  (ARRAY['meuble','meubles','furniture','أثاث','موبيليا'], 'furniture'),
  (ARRAY['vetement','vêtements','clothes','clothing','ملابس','حوايج'], 'fashion'),
  (ARRAY['chaussure','chaussures','shoes','حذاء','أحذية','صباط'], 'fashion'),
  (ARRAY['travail','emploi','job','work','عمل','وظيفة','خدمة'], 'jobs'),
  -- car makes & models popular in Algeria — bridges Latin ↔ Arabic script
  -- (sellers often write brand names in Arabic: كليو, رينو…)
  (ARRAY['renault','رينو'], 'brands'),
  (ARRAY['clio','كليو'], 'brands'),
  (ARRAY['symbol','سامبول','سيمبول'], 'brands'),
  (ARRAY['megane','mégane','ميقان','ميغان'], 'brands'),
  (ARRAY['kangoo','كانقو','كانغو'], 'brands'),
  (ARRAY['peugeot','بيجو','بوجو'], 'brands'),
  (ARRAY['partner','بارتنر'], 'brands'),
  (ARRAY['dacia','داسيا'], 'brands'),
  (ARRAY['logan','لوقان','لوغان'], 'brands'),
  (ARRAY['sandero','سانديرو'], 'brands'),
  (ARRAY['duster','داستر'], 'brands'),
  (ARRAY['volkswagen','فولكس فاجن','فولكسفاغن'], 'brands'),
  (ARRAY['golf','قولف','جولف','غولف'], 'brands'),
  (ARRAY['polo','بولو'], 'brands'),
  (ARRAY['passat','باسات'], 'brands'),
  (ARRAY['caddy','كادي'], 'brands'),
  (ARRAY['toyota','تويوتا'], 'brands'),
  (ARRAY['corolla','كورولا'], 'brands'),
  (ARRAY['hilux','هايلكس'], 'brands'),
  (ARRAY['yaris','ياريس'], 'brands'),
  (ARRAY['hyundai','هيونداي','هيوندا'], 'brands'),
  (ARRAY['accent','اكسنت'], 'brands'),
  (ARRAY['tucson','توسان'], 'brands'),
  (ARRAY['kia','كيا'], 'brands'),
  (ARRAY['picanto','بيكانتو'], 'brands'),
  (ARRAY['rio','ريو'], 'brands'),
  (ARRAY['sportage','سبورتاج'], 'brands'),
  (ARRAY['seat','سيات'], 'brands'),
  (ARRAY['ibiza','ابيزا'], 'brands'),
  (ARRAY['leon','ليون'], 'brands'),
  (ARRAY['skoda','شكودا','سكودا'], 'brands'),
  (ARRAY['octavia','اوكتافيا'], 'brands'),
  (ARRAY['fabia','فابيا'], 'brands'),
  (ARRAY['fiat','فيات'], 'brands'),
  (ARRAY['punto','بونتو'], 'brands'),
  (ARRAY['doblo','دوبلو'], 'brands'),
  (ARRAY['citroen','citroën','ستروين','سيتروان'], 'brands'),
  (ARRAY['berlingo','برلينقو','برلينغو'], 'brands'),
  (ARRAY['nissan','نيسان'], 'brands'),
  (ARRAY['micra','ميكرا'], 'brands'),
  (ARRAY['mercedes','مرسيدس'], 'brands'),
  (ARRAY['bmw','بي ام دبليو'], 'brands'),
  (ARRAY['audi','اودي'], 'brands'),
  (ARRAY['chevrolet','شيفروليه','شيفرولي'], 'brands'),
  (ARRAY['spark','سبارك'], 'brands'),
  (ARRAY['aveo','افيو'], 'brands'),
  (ARRAY['ford','فورد'], 'brands'),
  (ARRAY['fiesta','فييستا','فيستا'], 'brands'),
  (ARRAY['focus','فوكس'], 'brands'),
  (ARRAY['suzuki','سوزوكي'], 'brands'),
  (ARRAY['opel','اوبل'], 'brands'),
  (ARRAY['corsa','كورسا'], 'brands'),
  (ARRAY['astra','استرا'], 'brands')
) AS v(terms, cat);
