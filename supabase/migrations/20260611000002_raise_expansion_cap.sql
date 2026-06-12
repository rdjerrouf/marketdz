-- Cross-language test on cloud caught a truncation bug: groups with ~10 terms
-- (tires: pneu/pneus/tire/tires/tyre/tyres + 4 Arabic spellings) were trimmed
-- to 8 variants ALPHABETICALLY — Latin sorts before Arabic, so the Arabic
-- variants (the whole point of expansion) were the ones dropped. FR query
-- "pneus" couldn't find the إطارات listing.
--
-- Fix: raise the default cap to 12. Curation rule going forward: keep
-- search_lexicon groups at ≤ 12 terms so nothing is ever trimmed.

CREATE OR REPLACE FUNCTION public.build_search_tsqueries(
  p_search text,
  p_max_tokens int DEFAULT 6,
  p_max_expansions int DEFAULT 12
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
