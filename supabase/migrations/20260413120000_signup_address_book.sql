-- Signup: create first saved address from structured auth metadata.
-- Profile modal: users manage addresses in app (RLS already allows own rows).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_line1 text;
  v_city text;
  v_state text;
  v_pin text;
  v_full text;
  v_phone text;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), '')
  );

  v_line1 := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'address_line1', '')), '');
  v_city := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'city', '')), '');
  v_state := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'state', '')), '');
  v_pin := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'pincode', '')), '');
  v_full := COALESCE(NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''), 'Customer');
  v_phone := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), '');

  IF v_line1 IS NOT NULL
     AND v_city IS NOT NULL
     AND v_state IS NOT NULL
     AND v_pin IS NOT NULL
     AND v_phone IS NOT NULL
  THEN
    INSERT INTO public.addresses (
      user_id,
      label,
      full_name,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      country,
      is_default
    )
    VALUES (
      NEW.id,
      COALESCE(NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'address_label', '')), ''), 'Home'),
      v_full,
      v_phone,
      v_line1,
      NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'address_line2', '')), ''),
      v_city,
      v_state,
      v_pin,
      COALESCE(NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'country', '')), ''), 'India'),
      TRUE
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Collapse duplicate defaults per user (keep newest) before unique index.
UPDATE public.addresses a
SET is_default = FALSE
WHERE a.is_default IS TRUE
  AND a.id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM public.addresses
    WHERE is_default IS TRUE
    ORDER BY user_id, created_at DESC NULLS LAST
  );

-- At most one default address per user (helps checkout + profile).
CREATE UNIQUE INDEX IF NOT EXISTS addresses_one_default_per_user
  ON public.addresses (user_id)
  WHERE is_default = TRUE;
