-- Arabic RTL Full-Text Search Configuration for MarketDZ
-- Implements proper Unicode normalization, stemming, and RTL support

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create custom Arabic text search configuration
CREATE TEXT SEARCH CONFIGURATION ar_french_rtl (COPY = french);

-- Add Arabic stemming dictionary (using simple template without system stopwords file)
CREATE TEXT SEARCH DICTIONARY arabic_stem (
    TEMPLATE = simple
);

-- Create Arabic stop words (common Arabic words to ignore)
CREATE TABLE IF NOT EXISTS arabic_stopwords (
    word TEXT PRIMARY KEY
);

-- Insert Arabic stop words, ignoring duplicates
INSERT INTO arabic_stopwords (word) VALUES
('في'), ('من'), ('إلى'), ('على'), ('عن'), ('مع'), ('هذا'), ('هذه'),
('التي'), ('الذي'), ('التى'), ('اللذان'), ('اللتان'), ('اللواتي'),
('كان'), ('كانت'), ('يكون'), ('تكون'), ('سوف'), ('قد'), ('لقد'),
('ما'), ('لا'), ('لم'), ('لن'), ('إن'), ('أن'), ('كل'), ('بعض'),
('جميع'), ('كثير'), ('قليل'), ('كبير'), ('صغير'), ('جديد'), ('قديم'),
('أول'), ('آخر'), ('الآن'), ('اليوم'), ('أمس'), ('غدا'), ('هنا'),
('هناك'), ('أين'), ('كيف'), ('متى'), ('لماذا'), ('ماذا'),
('أي'), ('أية'), ('هو'), ('هي'), ('هم'), ('هن'), ('أنا'), ('أنت'),
('نحن'), ('أنتم'), ('أنتن'), ('ذلك'), ('تلك'), ('هؤلاء'), ('أولئك')
ON CONFLICT (word) DO NOTHING;

-- Create Arabic normalization function
CREATE OR REPLACE FUNCTION normalize_arabic_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Step 1: Normalize different forms of Alif and Hamza
    input_text := translate(input_text, 'ٱإآأإ', 'اااا');
    
    -- Step 2: Normalize different forms of Yeh and Teh Marbuta
    input_text := translate(input_text, 'يىئؤءة', 'ييييوه');
    
    -- Step 3: Remove diacritics (Harakat)
    input_text := translate(input_text, 'ًٌٍَُِّْٰٕٖٜٟٗ٘ٙٚٛٝٞٱٲٳٴٵٶٷٸٹٺٻټٽپٿڀځڂڃڄڅچڇڈډڊڋڌڍڎڏڐڑڒړڔڕږڗژڙښڛڜڝڞڟڠڡڢڣڤڥڦڧڨکڪګڬڭڮگڰڱڲڳڴڵڶڷڸڹںڻڼڽھڿۀہۂۃۄۅۆۇۈۉۊۋیۍێۏېۑےۓ۔ۖ', 'اااااا');
    
    -- Step 4: Remove extra whitespace and normalize
    input_text := regexp_replace(input_text, '\s+', ' ', 'g');
    input_text := trim(input_text);
    
    -- Step 5: Apply unaccent for any remaining diacritics
    input_text := unaccent(input_text);
    
    RETURN input_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create Arabic search preprocessing function
CREATE OR REPLACE FUNCTION preprocess_arabic_search(query_text TEXT)
RETURNS TEXT AS $$
DECLARE
    processed_text TEXT;
    words TEXT[];
    word TEXT;
    result_words TEXT[] := '{}';
BEGIN
    IF query_text IS NULL OR trim(query_text) = '' THEN
        RETURN '';
    END IF;
    
    -- Normalize the input
    processed_text := normalize_arabic_text(query_text);
    
    -- Split into words
    words := string_to_array(processed_text, ' ');
    
    -- Process each word
    FOREACH word IN ARRAY words LOOP
        -- Skip empty words and stop words
        IF trim(word) != '' AND NOT EXISTS (
            SELECT 1 FROM arabic_stopwords WHERE arabic_stopwords.word = word
        ) THEN
            -- Add word and prefix variant for partial matching
            result_words := array_append(result_words, word);
            IF length(word) >= 3 THEN
                result_words := array_append(result_words, word || ':*');
            END IF;
        END IF;
    END LOOP;
    
    RETURN array_to_string(result_words, ' ');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update listings table to support Arabic RTL search
ALTER TABLE listings 
DROP COLUMN IF EXISTS search_vector,
ADD COLUMN search_vector_ar tsvector,
ADD COLUMN search_vector_fr tsvector,
ADD COLUMN normalized_title_ar TEXT,
ADD COLUMN normalized_description_ar TEXT;

-- Create function to update Arabic search vectors
CREATE OR REPLACE FUNCTION update_listing_search_vectors()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalize Arabic text
    NEW.normalized_title_ar := normalize_arabic_text(NEW.title);
    NEW.normalized_description_ar := normalize_arabic_text(NEW.description);
    
    -- Create Arabic search vector with weighted fields
    NEW.search_vector_ar := 
        setweight(to_tsvector('arabic', COALESCE(NEW.normalized_title_ar, '')), 'A') ||
        setweight(to_tsvector('arabic', COALESCE(NEW.normalized_description_ar, '')), 'B') ||
        setweight(to_tsvector('arabic', COALESCE(NEW.category::text, '')), 'C') ||
        setweight(to_tsvector('arabic', COALESCE(NEW.location_wilaya, '')), 'D');
    
    -- Create French search vector for mixed content
    NEW.search_vector_fr := 
        setweight(to_tsvector('french', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('french', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('french', COALESCE(NEW.category::text, '')), 'C') ||
        setweight(to_tsvector('french', COALESCE(NEW.location_wilaya, '')), 'D');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vectors
DROP TRIGGER IF EXISTS update_listings_search_vector_trigger ON listings;
CREATE TRIGGER update_listings_search_vector_trigger
    BEFORE INSERT OR UPDATE OF title, description, category, location_wilaya
    ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_listing_search_vectors();

-- Create indexes for Arabic search optimization
CREATE INDEX IF NOT EXISTS idx_listings_search_vector_ar ON listings USING GIN(search_vector_ar);
CREATE INDEX IF NOT EXISTS idx_listings_search_vector_fr ON listings USING GIN(search_vector_fr);
CREATE INDEX IF NOT EXISTS idx_listings_normalized_title_ar ON listings USING GIN(normalized_title_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_normalized_description_ar ON listings USING GIN(normalized_description_ar gin_trgm_ops);

-- Update existing listings to populate search vectors
UPDATE listings SET 
    title = title,
    description = description
WHERE id IS NOT NULL;

-- Create optimized Arabic search function
CREATE OR REPLACE FUNCTION search_listings_arabic(
    search_term TEXT DEFAULT NULL,
    category_filter TEXT DEFAULT NULL,
    wilaya_filter TEXT DEFAULT NULL,
    price_min DECIMAL DEFAULT NULL,
    price_max DECIMAL DEFAULT NULL,
    rating_min DECIMAL DEFAULT NULL,
    search_mode TEXT DEFAULT 'mixed', -- 'arabic', 'french', 'mixed'
    sort_by TEXT DEFAULT 'relevance',
    sort_direction TEXT DEFAULT 'DESC',
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    price DECIMAL,
    category TEXT,
    location_wilaya TEXT,
    seller_id UUID,
    seller_name TEXT,
    seller_rating DECIMAL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    images JSONB,
    search_rank REAL
) AS $$
DECLARE
    search_query tsquery;
    arabic_query tsquery;
    french_query tsquery;
    processed_search TEXT;
    base_query TEXT;
    where_conditions TEXT := '';
    order_clause TEXT;
    final_query TEXT;
BEGIN
    -- Preprocess search term for Arabic
    IF search_term IS NOT NULL AND search_term != '' THEN
        processed_search := preprocess_arabic_search(search_term);
        
        -- Create search queries for different languages
        IF search_mode = 'arabic' OR search_mode = 'mixed' THEN
            BEGIN
                arabic_query := plainto_tsquery('arabic', processed_search);
            EXCEPTION WHEN OTHERS THEN
                arabic_query := plainto_tsquery('arabic', search_term);
            END;
        END IF;
        
        IF search_mode = 'french' OR search_mode = 'mixed' THEN
            BEGIN
                french_query := plainto_tsquery('french', search_term);
            EXCEPTION WHEN OTHERS THEN
                french_query := plainto_tsquery('simple', search_term);
            END;
        END IF;
    END IF;

    -- Build base query
    base_query := '
        SELECT DISTINCT
            l.id,
            l.title,
            l.description,
            l.price,
            l.category,
            l.location_wilaya,
            l.seller_id,
            p.full_name as seller_name,
            COALESCE(avg_ratings.rating, 0) as seller_rating,
            l.created_at,
            l.updated_at,
            l.images,';

    -- Add ranking based on search mode
    IF search_term IS NOT NULL AND search_term != '' THEN
        CASE search_mode
            WHEN 'arabic' THEN
                base_query := base_query || '
                    GREATEST(
                        ts_rank(l.search_vector_ar, $1::tsquery, 2),
                        similarity(l.normalized_title_ar, $2)
                    ) as search_rank';
            WHEN 'french' THEN
                base_query := base_query || '
                    ts_rank(l.search_vector_fr, $3::tsquery, 2) as search_rank';
            ELSE -- mixed mode
                base_query := base_query || '
                    GREATEST(
                        ts_rank(l.search_vector_ar, $1::tsquery, 2),
                        ts_rank(l.search_vector_fr, $3::tsquery, 2),
                        similarity(l.normalized_title_ar, $2),
                        similarity(l.title, $2)
                    ) as search_rank';
        END CASE;
    ELSE
        base_query := base_query || ' 0.5 as search_rank';
    END IF;

    -- Add FROM clause
    base_query := base_query || '
        FROM listings l
        LEFT JOIN profiles p ON l.seller_id = p.id
        LEFT JOIN (
            SELECT seller_id, AVG(rating) as rating
            FROM reviews
            GROUP BY seller_id
        ) avg_ratings ON l.seller_id = avg_ratings.seller_id';

    -- Build WHERE conditions
    where_conditions := ' WHERE l.status = ''active''';

    -- Add search conditions
    IF search_term IS NOT NULL AND search_term != '' THEN
        CASE search_mode
            WHEN 'arabic' THEN
                where_conditions := where_conditions || ' AND (l.search_vector_ar @@ $1::tsquery OR l.normalized_title_ar % $2)';
            WHEN 'french' THEN
                where_conditions := where_conditions || ' AND l.search_vector_fr @@ $3::tsquery';
            ELSE -- mixed mode
                where_conditions := where_conditions || ' AND (
                    l.search_vector_ar @@ $1::tsquery OR 
                    l.search_vector_fr @@ $3::tsquery OR 
                    l.normalized_title_ar % $2 OR 
                    l.title % $2
                )';
        END CASE;
    END IF;

    -- Add other filters
    IF category_filter IS NOT NULL THEN
        where_conditions := where_conditions || ' AND l.category = ''' || category_filter || '''';
    END IF;

    IF wilaya_filter IS NOT NULL THEN
        where_conditions := where_conditions || ' AND l.location_wilaya = ''' || wilaya_filter || '''';
    END IF;

    IF price_min IS NOT NULL THEN
        where_conditions := where_conditions || ' AND l.price >= ' || price_min;
    END IF;

    IF price_max IS NOT NULL THEN
        where_conditions := where_conditions || ' AND l.price <= ' || price_max;
    END IF;

    IF rating_min IS NOT NULL THEN
        where_conditions := where_conditions || ' AND COALESCE(avg_ratings.rating, 0) >= ' || rating_min;
    END IF;

    -- Add ORDER BY clause
    CASE sort_by
        WHEN 'relevance' THEN
            order_clause := ' ORDER BY search_rank ' || sort_direction || ', l.created_at DESC';
        WHEN 'price' THEN
            order_clause := ' ORDER BY l.price ' || sort_direction || ', search_rank DESC';
        WHEN 'date' THEN
            order_clause := ' ORDER BY l.created_at ' || sort_direction || ', search_rank DESC';
        WHEN 'rating' THEN
            order_clause := ' ORDER BY seller_rating ' || sort_direction || ', search_rank DESC';
        ELSE
            order_clause := ' ORDER BY l.created_at DESC, search_rank DESC';
    END CASE;

    -- Add LIMIT and OFFSET
    order_clause := order_clause || ' LIMIT ' || limit_count || ' OFFSET ' || offset_count;

    -- Construct final query
    final_query := base_query || where_conditions || order_clause;

    -- Execute query with parameters
    RETURN QUERY EXECUTE final_query 
    USING arabic_query, search_term, french_query;

END;
$$ LANGUAGE plpgsql STABLE;

-- Create function for Arabic prefix search (autocomplete)
CREATE OR REPLACE FUNCTION search_arabic_suggestions(
    partial_term TEXT,
    limit_count INTEGER DEFAULT 10
) RETURNS TABLE (
    suggestion TEXT,
    frequency INTEGER,
    category TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH normalized_input AS (
        SELECT normalize_arabic_text(partial_term) as norm_term
    ),
    title_matches AS (
        SELECT 
            unnest(string_to_array(normalized_title_ar, ' ')) as word,
            'title' as source,
            category
        FROM listings, normalized_input
        WHERE normalized_title_ar % normalized_input.norm_term
        AND status = 'active'
    ),
    description_matches AS (
        SELECT 
            unnest(string_to_array(normalized_description_ar, ' ')) as word,
            'description' as source,
            category
        FROM listings, normalized_input  
        WHERE normalized_description_ar % normalized_input.norm_term
        AND status = 'active'
        LIMIT 1000 -- Limit to avoid performance issues
    )
    SELECT 
        word as suggestion,
        COUNT(*)::INTEGER as frequency,
        mode() WITHIN GROUP (ORDER BY category) as category
    FROM (
        SELECT word, source, category FROM title_matches
        UNION ALL
        SELECT word, source, category FROM description_matches
    ) all_matches
    WHERE length(word) >= 2
    AND word ILIKE (SELECT norm_term FROM normalized_input) || '%'
    GROUP BY word
    HAVING COUNT(*) >= 2
    ORDER BY frequency DESC, length(word) ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_listings_arabic IS 'Optimized Arabic RTL search with Unicode normalization and stemming';
COMMENT ON FUNCTION normalize_arabic_text IS 'Normalizes Arabic text for better search matching';
COMMENT ON FUNCTION preprocess_arabic_search IS 'Preprocesses Arabic search queries with stop words removal';
COMMENT ON FUNCTION search_arabic_suggestions IS 'Provides Arabic autocomplete suggestions';