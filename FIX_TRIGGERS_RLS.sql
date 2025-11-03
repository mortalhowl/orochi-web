-- Fix RLS issues with triggers
-- Run this on Supabase SQL Editor

-- ============================================
-- 1. Fix trigger tạo ticket_number
-- ============================================

-- Drop existing function and recreate with SECURITY DEFINER
DROP FUNCTION IF EXISTS public.set_ticket_number() CASCADE;

CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Chạy với quyền của owner (postgres), không phải user
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS set_ticket_number_trigger ON tickets;
CREATE TRIGGER set_ticket_number_trigger
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- ============================================
-- 2. Fix trigger update profile points
-- ============================================

DROP FUNCTION IF EXISTS public.update_profile_points_on_transaction() CASCADE;

CREATE OR REPLACE FUNCTION public.update_profile_points_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Chạy với quyền postgres
SET search_path = public
AS $$
BEGIN
  -- Update profile points
  UPDATE profiles
  SET
    current_points = current_points + NEW.points,
    total_points = total_points + NEW.points,
    lifetime_points = CASE
      WHEN NEW.points > 0 THEN lifetime_points + NEW.points
      ELSE lifetime_points
    END,
    updated_at = NOW()
  WHERE id = NEW.user_id;

  -- Update balance_after in the transaction
  UPDATE point_transactions
  SET balance_after = (SELECT current_points FROM profiles WHERE id = NEW.user_id)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_update_profile_points ON point_transactions;
CREATE TRIGGER trigger_update_profile_points
  AFTER INSERT ON point_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_points_on_transaction();

-- ============================================
-- 3. Fix trigger auto update rank
-- ============================================

DROP FUNCTION IF EXISTS public.auto_update_user_rank() CASCADE;

CREATE OR REPLACE FUNCTION public.auto_update_user_rank()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Chạy với quyền postgres
SET search_path = public
AS $$
DECLARE
  new_rank_id UUID;
  old_rank_id UUID;
BEGIN
  old_rank_id := OLD.rank_id;

  -- Find appropriate rank based on total_points
  SELECT id INTO new_rank_id
  FROM ranks
  WHERE is_active = true
    AND NEW.total_points >= min_points
  ORDER BY min_points DESC
  LIMIT 1;

  -- If rank changed, update and log history
  IF new_rank_id IS DISTINCT FROM old_rank_id THEN
    NEW.rank_id := new_rank_id;

    -- Insert into rank_history
    INSERT INTO rank_history (user_id, from_rank_id, to_rank_id)
    VALUES (NEW.id, old_rank_id, new_rank_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS auto_update_rank_trigger ON profiles;
CREATE TRIGGER auto_update_rank_trigger
  BEFORE UPDATE OF total_points ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_user_rank();

-- ============================================
-- 4. Fix các functions generate code
-- ============================================

-- generate_ticket_number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  date_part TEXT;
  sequence_part INT;
  new_number TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');

  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 13) AS INT)), 0) + 1
  INTO sequence_part
  FROM tickets
  WHERE ticket_number LIKE 'TICKET-' || date_part || '%';

  new_number := 'TICKET-' || date_part || '-' || LPAD(sequence_part::TEXT, 5, '0');

  RETURN new_number;
END;
$$;

-- generate_ticket_code (nếu có)
CREATE OR REPLACE FUNCTION public.generate_ticket_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INT, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- ============================================
-- 5. Verify all functions are SECURITY DEFINER
-- ============================================

-- Check which functions are SECURITY DEFINER
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'set_ticket_number',
    'update_profile_points_on_transaction',
    'auto_update_user_rank',
    'generate_ticket_number',
    'generate_ticket_code'
  )
ORDER BY routine_name;

-- Expected output: All should have security_type = 'DEFINER'
