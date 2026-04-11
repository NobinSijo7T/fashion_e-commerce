-- Signup trigger runs with no JWT, so auth.uid() is NULL. Strict RLS on profiles
-- (profiles_insert_own … WITH CHECK (auth.uid() = id)) blocks the trigger insert.
-- Disable row security for statements inside this SECURITY DEFINER function only.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
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
