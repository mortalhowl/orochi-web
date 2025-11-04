


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."add_test_points"("p_user_id" "uuid", "p_points" integer, "p_reason" "text" DEFAULT 'Manual test points'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Lấy balance hiện tại
  SELECT current_points INTO current_balance
  FROM public.profiles
  WHERE id = p_user_id;

  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  new_balance := current_balance + p_points;

  -- Update profile
  UPDATE public.profiles
  SET 
    total_points = total_points + p_points,
    current_points = new_balance,
    lifetime_points = lifetime_points + p_points,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Ghi transaction
  INSERT INTO public.point_transactions (
    user_id,
    type,
    points,
    balance_after,
    reason,
    reference_type
  )
  VALUES (
    p_user_id,
    'bonus',
    p_points,
    new_balance,
    p_reason,
    'manual'
  );

  RAISE NOTICE 'Added % points to user %. New balance: %', p_points, p_user_id, new_balance;
END;
$$;


ALTER FUNCTION "public"."add_test_points"("p_user_id" "uuid", "p_points" integer, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_update_user_rank"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."auto_update_user_rank"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_order_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  date_part TEXT;
  sequence_part INT;
  new_number TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');

  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 13) AS INT)), 0) + 1
  INTO sequence_part
  FROM orders
  WHERE order_number LIKE 'ORD-' || date_part || '%';

  new_number := 'ORD-' || date_part || '-' || LPAD(sequence_part::TEXT, 3, '0');

  RETURN new_number;
END;
$$;


ALTER FUNCTION "public"."generate_order_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_ticket_code"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."generate_ticket_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_ticket_number"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  timestamp_part BIGINT;
  random_part TEXT;
  hash_part TEXT;
  new_number TEXT;
  is_unique BOOLEAN := FALSE;
BEGIN
  WHILE NOT is_unique LOOP
    -- Use timestamp in microseconds
    timestamp_part := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000000;

    -- Generate random string (6 chars)
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

    -- Generate hash from timestamp + random (8 chars)
    hash_part := UPPER(SUBSTRING(MD5(timestamp_part::TEXT || random_part) FROM 1 FOR 8));

    -- Format: TK-HASH-RANDOM (e.g., TK-A3F8B9C2-X7Y4Z1)
    new_number := 'TK-' || hash_part || '-' || random_part;

    -- Check uniqueness
    SELECT NOT EXISTS(
      SELECT 1 FROM tickets WHERE ticket_number = new_number
    ) INTO is_unique;
  END LOOP;

  RETURN new_number;
END;
$$;


ALTER FUNCTION "public"."generate_ticket_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_transaction_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INT, 1);
  END LOOP;
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."generate_transaction_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_permissions"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  role_permissions JSONB;
  custom_add JSONB;
  custom_remove JSONB;
  final_permissions JSONB;
BEGIN
  -- Get role permissions
  SELECT r.permissions INTO role_permissions
  FROM public.admin_users au
  JOIN public.roles r ON au.role_id = r.id
  WHERE au.user_id = p_user_id 
    AND au.is_active = TRUE
    AND r.is_active = TRUE;

  -- If super admin (wildcard), return all
  IF role_permissions @> '["*"]'::JSONB THEN
    RETURN '["*"]'::JSONB;
  END IF;

  -- Get custom permissions
  SELECT 
    custom_permissions->'add',
    custom_permissions->'remove'
  INTO custom_add, custom_remove
  FROM public.admin_users
  WHERE user_id = p_user_id;

  -- Combine permissions
  final_permissions := role_permissions;

  -- Add custom permissions
  IF custom_add IS NOT NULL THEN
    final_permissions := final_permissions || custom_add;
  END IF;

  -- Remove custom permissions
  IF custom_remove IS NOT NULL THEN
    -- Remove logic (more complex, simplified here)
    final_permissions := final_permissions;
  END IF;

  RETURN final_permissions;
END;
$$;


ALTER FUNCTION "public"."get_user_permissions"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  default_rank_id UUID;
BEGIN
  -- Lấy rank thấp nhất (Bronze/level 1)
  SELECT id INTO default_rank_id
  FROM public.ranks
  WHERE level = 1
  LIMIT 1;

  -- Tạo profile mới
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    total_points,
    current_points,
    lifetime_points,
    rank_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    0,
    0,
    0,
    default_rank_id
  );

  -- Tặng điểm đăng ký (nếu có rule)
  DECLARE
    signup_points INTEGER;
  BEGIN
    SELECT points_per_action INTO signup_points
    FROM public.point_rules
    WHERE event_type = 'sign_up'
      AND is_active = TRUE
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_until IS NULL OR valid_until >= NOW())
    LIMIT 1;

    -- Nếu có quy tắc tặng điểm đăng ký
    IF signup_points IS NOT NULL AND signup_points > 0 THEN
      -- Cộng điểm
      UPDATE public.profiles
      SET 
        total_points = signup_points,
        current_points = signup_points,
        lifetime_points = signup_points
      WHERE id = NEW.id;

      -- Ghi transaction
      INSERT INTO public.point_transactions (
        user_id,
        type,
        points,
        balance_after,
        reason
      )
      VALUES (
        NEW.id,
        'bonus',
        signup_points,
        signup_points,
        'Welcome bonus for signing up'
      );
    END IF;
  END;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Profile sẽ tự động xóa do CASCADE
  -- Nhưng có thể thêm logic khác nếu cần (vd: archive data)
  
  -- Log deletion (optional)
  -- INSERT INTO audit_log ...
  
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."handle_user_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_user_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Update profile khi user metadata thay đổi
  UPDATE public.profiles
  SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
    avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_user_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_permission"("p_user_id" "uuid", "p_permission" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_permissions JSONB;
BEGIN
  user_permissions := public.get_user_permissions(p_user_id);
  
  -- Check wildcard (super admin)
  IF user_permissions @> '["*"]'::JSONB THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission
  RETURN user_permissions @> jsonb_build_array(p_permission);
END;
$$;


ALTER FUNCTION "public"."has_permission"("p_user_id" "uuid", "p_permission" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_ticket_sold_count"("ticket_type_id" "uuid", "increment_by" integer DEFAULT 1) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE ticket_types
  SET sold_count = sold_count + increment_by
  WHERE id = ticket_type_id;
END;
$$;


ALTER FUNCTION "public"."increment_ticket_sold_count"("ticket_type_id" "uuid", "increment_by" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = p_user_id 
      AND is_active = TRUE
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."migrate_existing_users"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_record RECORD;
  default_rank_id UUID;
BEGIN
  -- Lấy rank mặc định
  SELECT id INTO default_rank_id
  FROM public.ranks
  WHERE level = 1
  LIMIT 1;

  -- Loop qua tất cả users chưa có profile
  FOR user_record IN
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Tạo profile
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      avatar_url,
      total_points,
      current_points,
      lifetime_points,
      rank_id
    )
    VALUES (
      user_record.id,
      user_record.email,
      user_record.raw_user_meta_data->>'full_name',
      user_record.raw_user_meta_data->>'avatar_url',
      0,
      0,
      0,
      default_rank_id
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Created profile for user: %', user_record.email;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."migrate_existing_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_user_points"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.profiles
  SET 
    total_points = 0,
    current_points = 0,
    updated_at = NOW()
  WHERE id = p_user_id;

  DELETE FROM public.point_transactions
  WHERE user_id = p_user_id;

  RAISE NOTICE 'Reset points for user %', p_user_id;
END;
$$;


ALTER FUNCTION "public"."reset_user_points"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_order_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_order_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_ticket_number"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_ticket_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_transaction_code"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.transaction_code IS NULL THEN
    NEW.transaction_code := generate_transaction_code();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_transaction_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_event_attendees"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.payment_status = 'paid' THEN
    UPDATE public.events
    SET current_attendees = current_attendees + (
      SELECT COUNT(*) FROM public.tickets WHERE order_id = NEW.id
    )
    WHERE id = NEW.event_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_event_attendees"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_points_on_transaction"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."update_profile_points_on_transaction"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "custom_permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "notes" "text"
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."blog_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "excerpt" "text",
    "content" "text" NOT NULL,
    "category_id" "uuid",
    "featured_image" "text",
    "author_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "published_at" timestamp with time zone,
    "meta_title" "text",
    "meta_description" "text",
    "meta_keywords" "text"[],
    "view_count" integer DEFAULT 0,
    "tags" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "blog_posts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkin_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "scanned_by" "uuid" NOT NULL,
    "scan_method" "text",
    "device_info" "jsonb",
    "ip_address" "text",
    "location" "text",
    "status" "text" NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "checkin_logs_scan_method_check" CHECK (("scan_method" = ANY (ARRAY['qr'::"text", 'manual'::"text", 'nfc'::"text"]))),
    CONSTRAINT "checkin_logs_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'already_used'::"text", 'invalid'::"text", 'expired'::"text", 'wrong_event'::"text"])))
);


ALTER TABLE "public"."checkin_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "color" "text",
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sort_order" integer DEFAULT 0
);


ALTER TABLE "public"."event_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "content" "text",
    "featured_image" "text",
    "banner_image" "text",
    "gallery" "jsonb" DEFAULT '[]'::"jsonb",
    "category_id" "uuid",
    "location_name" "text",
    "location_address" "text",
    "location_map_url" "text",
    "location_lat" numeric(10,8),
    "location_lng" numeric(11,8),
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "registration_start" timestamp with time zone,
    "registration_end" timestamp with time zone,
    "max_attendees" integer,
    "current_attendees" integer DEFAULT 0,
    "status" "text" DEFAULT 'draft'::"text",
    "is_featured" boolean DEFAULT false,
    "meta_title" "text",
    "meta_description" "text",
    "og_image" "text",
    "views_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "events_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'cancelled'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_activities" OWNER TO "postgres";


COMMENT ON TABLE "public"."order_activities" IS 'Audit log for order status changes';



CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_number" "text" NOT NULL,
    "transaction_code" "text" NOT NULL,
    "user_id" "uuid",
    "customer_name" "text" NOT NULL,
    "customer_email" "text" NOT NULL,
    "customer_phone" "text" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "items" "jsonb" NOT NULL,
    "subtotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "discount_amount" numeric(10,2) DEFAULT 0,
    "final_amount" numeric(10,2) NOT NULL,
    "payment_method" "text" DEFAULT 'vietqr'::"text",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "payment_proof_url" "text",
    "paid_at" timestamp with time zone,
    "order_status" "text" DEFAULT 'pending'::"text",
    "bank_account_name" "text",
    "bank_account_number" "text",
    "bank_name" "text",
    "qr_code_url" "text",
    "admin_notes" "text",
    "cancelled_reason" "text",
    "confirmed_by" "uuid",
    "confirmed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "payment_qr_code" "text",
    "payment_reference" "text",
    "payment_bank_account" "text",
    "payment_bank_name" "text",
    "payment_expires_at" timestamp with time zone,
    "admin_note" "text",
    CONSTRAINT "orders_order_status_check" CHECK (("order_status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text", 'completed'::"text"]))),
    CONSTRAINT "orders_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'failed'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON TABLE "public"."orders" IS 'Customer orders with VietQR payment flow';



COMMENT ON COLUMN "public"."orders"."transaction_code" IS 'Mã giao dịch gửi kèm VietQR (8 ký tự)';



COMMENT ON COLUMN "public"."orders"."items" IS 'JSONB array of order items for quick access';



COMMENT ON COLUMN "public"."orders"."expires_at" IS 'Order expires after 15 minutes if not paid';



CREATE TABLE IF NOT EXISTS "public"."payment_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "verified_by" "uuid" NOT NULL,
    "verification_method" "text",
    "bank_transaction_id" "text",
    "bank_transaction_amount" numeric(12,2),
    "bank_transaction_date" timestamp with time zone,
    "bank_account_number" "text",
    "is_verified" boolean DEFAULT false,
    "verification_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_verifications_verification_method_check" CHECK (("verification_method" = ANY (ARRAY['manual'::"text", 'screenshot'::"text", 'bank_statement'::"text"])))
);


ALTER TABLE "public"."payment_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permissions_catalog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."permissions_catalog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."point_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "event_type" "text" NOT NULL,
    "points_per_action" integer NOT NULL,
    "points_per_currency" numeric(10,2),
    "max_points_per_day" integer,
    "max_points_per_user" integer,
    "min_order_value" numeric(10,2),
    "applicable_rank_ids" "uuid"[],
    "valid_from" timestamp with time zone,
    "valid_until" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "priority" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "point_rules_event_type_check" CHECK (("event_type" = ANY (ARRAY['purchase'::"text", 'review'::"text", 'referral'::"text", 'birthday'::"text", 'sign_up'::"text", 'social_share'::"text", 'daily_checkin'::"text"])))
);


ALTER TABLE "public"."point_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."point_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "points" integer NOT NULL,
    "balance_after" integer NOT NULL,
    "reason" "text" NOT NULL,
    "reference_type" "text",
    "reference_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "admin_note" "text",
    "created_by" "uuid",
    CONSTRAINT "point_transactions_type_check" CHECK (("type" = ANY (ARRAY['earn'::"text", 'spend'::"text", 'expire'::"text", 'admin_adjust'::"text", 'bonus'::"text", 'refund'::"text"])))
);


ALTER TABLE "public"."point_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "phone" "text",
    "total_points" integer DEFAULT 0 NOT NULL,
    "current_points" integer DEFAULT 0 NOT NULL,
    "lifetime_points" integer DEFAULT 0 NOT NULL,
    "rank_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_current_points_check" CHECK (("current_points" >= 0)),
    CONSTRAINT "profiles_lifetime_points_check" CHECK (("lifetime_points" >= 0)),
    CONSTRAINT "profiles_total_points_check" CHECK (("total_points" >= 0))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rank_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "from_rank_id" "uuid",
    "to_rank_id" "uuid" NOT NULL,
    "points_at_change" integer NOT NULL,
    "reason" "text",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rank_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ranks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "min_points" integer NOT NULL,
    "max_points" integer,
    "point_multiplier" numeric(3,2) DEFAULT 1.0 NOT NULL,
    "discount_percentage" integer DEFAULT 0,
    "color" "text",
    "icon_url" "text",
    "badge_url" "text",
    "level" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ranks_check" CHECK ((("max_points" IS NULL) OR ("max_points" >= "min_points"))),
    CONSTRAINT "ranks_discount_percentage_check" CHECK ((("discount_percentage" >= 0) AND ("discount_percentage" <= 100))),
    CONSTRAINT "ranks_min_points_check" CHECK (("min_points" >= 0)),
    CONSTRAINT "valid_point_range" CHECK ((("max_points" IS NULL) OR ("max_points" > "min_points")))
);


ALTER TABLE "public"."ranks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_change_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_user_id" "uuid",
    "action" "text",
    "old_value" "jsonb",
    "new_value" "jsonb",
    "changed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "role_change_logs_action_check" CHECK (("action" = ANY (ARRAY['role_changed'::"text", 'permission_added'::"text", 'permission_removed'::"text", 'activated'::"text", 'deactivated'::"text"])))
);


ALTER TABLE "public"."role_change_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "permissions" "jsonb" DEFAULT '[]'::"jsonb",
    "is_system_role" boolean DEFAULT false NOT NULL,
    "color" "text" DEFAULT '#64748b'::"text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "quantity" integer NOT NULL,
    "sold_count" integer DEFAULT 0,
    "sale_start" timestamp with time zone,
    "sale_end" timestamp with time zone,
    "benefits" "jsonb" DEFAULT '[]'::"jsonb",
    "points_earned" integer DEFAULT 0,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ticket_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_number" "text" NOT NULL,
    "qr_code" "text" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "ticket_type_id" "uuid" NOT NULL,
    "holder_name" "text" NOT NULL,
    "holder_email" "text" NOT NULL,
    "ticket_type_name" "text" NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'valid'::"text",
    "checked_in_at" timestamp with time zone,
    "checked_in_by" "uuid",
    "checked_in_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tickets_status_check" CHECK (("status" = ANY (ARRAY['valid'::"text", 'used'::"text", 'cancelled'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


COMMENT ON TABLE "public"."tickets" IS 'Individual tickets with QR codes for check-in';



COMMENT ON COLUMN "public"."tickets"."qr_code" IS 'QR code content for check-in scanning';



CREATE TABLE IF NOT EXISTS "public"."user_vouchers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "voucher_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'available'::"text" NOT NULL,
    "acquired_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "used_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "order_id" "uuid",
    "points_spent" integer DEFAULT 0,
    CONSTRAINT "user_vouchers_status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'used'::"text", 'expired'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."user_vouchers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vouchers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "discount_value" numeric(10,2),
    "max_discount" numeric(10,2),
    "min_order_value" numeric(10,2),
    "required_rank_id" "uuid",
    "required_points" integer DEFAULT 0,
    "max_usage_per_user" integer DEFAULT 1,
    "max_total_usage" integer,
    "current_usage" integer DEFAULT 0,
    "valid_from" timestamp with time zone NOT NULL,
    "valid_until" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_exclusive" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "valid_dates" CHECK (("valid_until" > "valid_from")),
    CONSTRAINT "vouchers_type_check" CHECK (("type" = ANY (ARRAY['percentage'::"text", 'fixed'::"text", 'free_shipping'::"text", 'gift'::"text"])))
);


ALTER TABLE "public"."vouchers" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."blog_categories"
    ADD CONSTRAINT "blog_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."blog_categories"
    ADD CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_categories"
    ADD CONSTRAINT "blog_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."checkin_logs"
    ADD CONSTRAINT "checkin_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."order_activities"
    ADD CONSTRAINT "order_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_transaction_code_key" UNIQUE ("transaction_code");



ALTER TABLE ONLY "public"."payment_verifications"
    ADD CONSTRAINT "payment_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions_catalog"
    ADD CONSTRAINT "permissions_catalog_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."permissions_catalog"
    ADD CONSTRAINT "permissions_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."point_rules"
    ADD CONSTRAINT "point_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rank_history"
    ADD CONSTRAINT "rank_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ranks"
    ADD CONSTRAINT "ranks_level_key" UNIQUE ("level");



ALTER TABLE ONLY "public"."ranks"
    ADD CONSTRAINT "ranks_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."ranks"
    ADD CONSTRAINT "ranks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_change_logs"
    ADD CONSTRAINT "role_change_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_types"
    ADD CONSTRAINT "ticket_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_qr_code_key" UNIQUE ("qr_code");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_ticket_number_key" UNIQUE ("ticket_number");



ALTER TABLE ONLY "public"."user_vouchers"
    ADD CONSTRAINT "user_vouchers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_vouchers"
    ADD CONSTRAINT "user_vouchers_user_id_voucher_id_acquired_at_key" UNIQUE ("user_id", "voucher_id", "acquired_at");



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admin_users_active" ON "public"."admin_users" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_admin_users_role" ON "public"."admin_users" USING "btree" ("role_id");



CREATE INDEX "idx_admin_users_user" ON "public"."admin_users" USING "btree" ("user_id");



CREATE INDEX "idx_blog_posts_category" ON "public"."blog_posts" USING "btree" ("category_id");



CREATE INDEX "idx_blog_posts_published" ON "public"."blog_posts" USING "btree" ("published_at");



CREATE INDEX "idx_blog_posts_slug" ON "public"."blog_posts" USING "btree" ("slug");



CREATE INDEX "idx_blog_posts_status" ON "public"."blog_posts" USING "btree" ("status");



CREATE INDEX "idx_checkin_logs_event" ON "public"."checkin_logs" USING "btree" ("event_id");



CREATE INDEX "idx_checkin_logs_scanned_by" ON "public"."checkin_logs" USING "btree" ("scanned_by");



CREATE INDEX "idx_checkin_logs_ticket" ON "public"."checkin_logs" USING "btree" ("ticket_id");



CREATE INDEX "idx_event_categories_active" ON "public"."event_categories" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_event_categories_sort" ON "public"."event_categories" USING "btree" ("sort_order");



CREATE INDEX "idx_order_activities_created_at" ON "public"."order_activities" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_order_activities_order_id" ON "public"."order_activities" USING "btree" ("order_id");



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_orders_customer_email" ON "public"."orders" USING "btree" ("customer_email");



CREATE INDEX "idx_orders_event_id" ON "public"."orders" USING "btree" ("event_id");



CREATE INDEX "idx_orders_order_number" ON "public"."orders" USING "btree" ("order_number");



CREATE INDEX "idx_orders_order_status" ON "public"."orders" USING "btree" ("order_status");



CREATE INDEX "idx_orders_payment_status" ON "public"."orders" USING "btree" ("payment_status");



CREATE INDEX "idx_orders_transaction_code" ON "public"."orders" USING "btree" ("transaction_code");



CREATE INDEX "idx_payment_verifications_order_id" ON "public"."payment_verifications" USING "btree" ("order_id");



CREATE INDEX "idx_permissions_category" ON "public"."permissions_catalog" USING "btree" ("category");



CREATE INDEX "idx_point_rules_active" ON "public"."point_rules" USING "btree" ("event_type") WHERE ("is_active" = true);



CREATE INDEX "idx_point_transactions_reference" ON "public"."point_transactions" USING "btree" ("reference_type", "reference_id");



CREATE INDEX "idx_point_transactions_type" ON "public"."point_transactions" USING "btree" ("type");



CREATE INDEX "idx_point_transactions_user" ON "public"."point_transactions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_profiles_points" ON "public"."profiles" USING "btree" ("total_points" DESC);



CREATE INDEX "idx_profiles_rank" ON "public"."profiles" USING "btree" ("rank_id");



CREATE INDEX "idx_rank_history_user" ON "public"."rank_history" USING "btree" ("user_id", "changed_at" DESC);



CREATE INDEX "idx_ranks_level" ON "public"."ranks" USING "btree" ("level");



CREATE INDEX "idx_ranks_points" ON "public"."ranks" USING "btree" ("min_points");



CREATE INDEX "idx_role_change_logs_admin" ON "public"."role_change_logs" USING "btree" ("admin_user_id");



CREATE INDEX "idx_role_change_logs_date" ON "public"."role_change_logs" USING "btree" ("created_at");



CREATE INDEX "idx_roles_active" ON "public"."roles" USING "btree" ("is_active");



CREATE INDEX "idx_roles_name" ON "public"."roles" USING "btree" ("name");



CREATE INDEX "idx_tickets_event_id" ON "public"."tickets" USING "btree" ("event_id");



CREATE INDEX "idx_tickets_order_id" ON "public"."tickets" USING "btree" ("order_id");



CREATE INDEX "idx_tickets_qr_code" ON "public"."tickets" USING "btree" ("qr_code");



CREATE INDEX "idx_tickets_status" ON "public"."tickets" USING "btree" ("status");



CREATE INDEX "idx_tickets_ticket_number" ON "public"."tickets" USING "btree" ("ticket_number");



CREATE INDEX "idx_user_vouchers_status" ON "public"."user_vouchers" USING "btree" ("status");



CREATE INDEX "idx_user_vouchers_user" ON "public"."user_vouchers" USING "btree" ("user_id", "status");



CREATE INDEX "idx_user_vouchers_voucher" ON "public"."user_vouchers" USING "btree" ("voucher_id");



CREATE INDEX "idx_vouchers_code" ON "public"."vouchers" USING "btree" ("code") WHERE ("is_active" = true);



CREATE INDEX "idx_vouchers_dates" ON "public"."vouchers" USING "btree" ("valid_from", "valid_until");



CREATE INDEX "idx_vouchers_rank" ON "public"."vouchers" USING "btree" ("required_rank_id");



CREATE OR REPLACE TRIGGER "auto_update_rank_trigger" BEFORE UPDATE OF "total_points" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."auto_update_user_rank"();



CREATE OR REPLACE TRIGGER "set_order_number_trigger" BEFORE INSERT ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_order_number"();



CREATE OR REPLACE TRIGGER "set_ticket_number_trigger" BEFORE INSERT ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."set_ticket_number"();



CREATE OR REPLACE TRIGGER "set_transaction_code_trigger" BEFORE INSERT ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_transaction_code"();



CREATE OR REPLACE TRIGGER "trigger_update_profile_points" AFTER INSERT ON "public"."point_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_profile_points_on_transaction"();



CREATE OR REPLACE TRIGGER "update_admin_users_updated_at" BEFORE UPDATE ON "public"."admin_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_event_categories_updated_at" BEFORE UPDATE ON "public"."event_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_roles_updated_at" BEFORE UPDATE ON "public"."roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tickets_updated_at" BEFORE UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_vouchers_updated_at" BEFORE UPDATE ON "public"."vouchers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id");



ALTER TABLE ONLY "public"."checkin_logs"
    ADD CONSTRAINT "checkin_logs_scanned_by_fkey" FOREIGN KEY ("scanned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."event_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_activities"
    ADD CONSTRAINT "order_activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_activities"
    ADD CONSTRAINT "order_activities_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_verifications"
    ADD CONSTRAINT "payment_verifications_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_verifications"
    ADD CONSTRAINT "payment_verifications_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_rank_id_fkey" FOREIGN KEY ("rank_id") REFERENCES "public"."ranks"("id");



ALTER TABLE ONLY "public"."rank_history"
    ADD CONSTRAINT "rank_history_from_rank_id_fkey" FOREIGN KEY ("from_rank_id") REFERENCES "public"."ranks"("id");



ALTER TABLE ONLY "public"."rank_history"
    ADD CONSTRAINT "rank_history_to_rank_id_fkey" FOREIGN KEY ("to_rank_id") REFERENCES "public"."ranks"("id");



ALTER TABLE ONLY "public"."rank_history"
    ADD CONSTRAINT "rank_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_change_logs"
    ADD CONSTRAINT "role_change_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id");



ALTER TABLE ONLY "public"."role_change_logs"
    ADD CONSTRAINT "role_change_logs_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ticket_types"
    ADD CONSTRAINT "ticket_types_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_checked_in_by_fkey" FOREIGN KEY ("checked_in_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_vouchers"
    ADD CONSTRAINT "user_vouchers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_vouchers"
    ADD CONSTRAINT "user_vouchers_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_required_rank_id_fkey" FOREIGN KEY ("required_rank_id") REFERENCES "public"."ranks"("id");



CREATE POLICY "Admin can view own info" ON "public"."admin_users" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Admins full access to categories" ON "public"."event_categories" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE (("admin_users"."user_id" = "auth"."uid"()) AND ("admin_users"."is_active" = true)))));



CREATE POLICY "Anyone can view active roles" ON "public"."roles" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active vouchers" ON "public"."vouchers" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view published posts" ON "public"."blog_posts" FOR SELECT USING (("status" = 'published'::"text"));



CREATE POLICY "Anyone can view ranks" ON "public"."ranks" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can view active categories" ON "public"."event_categories" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Super admin can manage admin users" ON "public"."admin_users" USING ("public"."has_permission"("auth"."uid"(), 'admins.create'::"text"));



CREATE POLICY "Super admin can manage roles" ON "public"."roles" USING (("public"."has_permission"("auth"."uid"(), 'roles.create'::"text") OR "public"."has_permission"("auth"."uid"(), 'roles.update'::"text") OR "public"."has_permission"("auth"."uid"(), 'roles.delete'::"text")));



CREATE POLICY "Super admin can view all admin users" ON "public"."admin_users" FOR SELECT USING ("public"."has_permission"("auth"."uid"(), 'admins.view'::"text"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own order activities" ON "public"."order_activities" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_activities"."order_id") AND (("orders"."user_id" = "auth"."uid"()) OR ("orders"."customer_email" = (( SELECT "users"."email"
           FROM "auth"."users"
          WHERE ("users"."id" = "auth"."uid"())))::"text"))))) OR (EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE (("admin_users"."user_id" = "auth"."uid"()) AND ("admin_users"."is_active" = true))))));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own rank history" ON "public"."rank_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own transactions" ON "public"."point_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own vouchers" ON "public"."user_vouchers" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rank_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ranks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_vouchers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vouchers" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."add_test_points"("p_user_id" "uuid", "p_points" integer, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_test_points"("p_user_id" "uuid", "p_points" integer, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_test_points"("p_user_id" "uuid", "p_points" integer, "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_update_user_rank"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_update_user_rank"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_update_user_rank"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_ticket_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_ticket_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_ticket_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_ticket_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_ticket_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_ticket_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_transaction_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_transaction_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_transaction_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_permissions"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_delete"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_user_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_permission"("p_user_id" "uuid", "p_permission" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_permission"("p_user_id" "uuid", "p_permission" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("p_user_id" "uuid", "p_permission" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_ticket_sold_count"("ticket_type_id" "uuid", "increment_by" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_ticket_sold_count"("ticket_type_id" "uuid", "increment_by" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_ticket_sold_count"("ticket_type_id" "uuid", "increment_by" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."migrate_existing_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_existing_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_existing_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_user_points"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reset_user_points"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_user_points"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_ticket_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_ticket_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_ticket_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_transaction_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_transaction_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_transaction_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_event_attendees"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_event_attendees"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_event_attendees"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile_points_on_transaction"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_points_on_transaction"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_points_on_transaction"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."blog_categories" TO "anon";
GRANT ALL ON TABLE "public"."blog_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_categories" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."checkin_logs" TO "anon";
GRANT ALL ON TABLE "public"."checkin_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."checkin_logs" TO "service_role";



GRANT ALL ON TABLE "public"."event_categories" TO "anon";
GRANT ALL ON TABLE "public"."event_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."event_categories" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."order_activities" TO "anon";
GRANT ALL ON TABLE "public"."order_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."order_activities" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payment_verifications" TO "anon";
GRANT ALL ON TABLE "public"."payment_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."permissions_catalog" TO "anon";
GRANT ALL ON TABLE "public"."permissions_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions_catalog" TO "service_role";



GRANT ALL ON TABLE "public"."point_rules" TO "anon";
GRANT ALL ON TABLE "public"."point_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."point_rules" TO "service_role";



GRANT ALL ON TABLE "public"."point_transactions" TO "anon";
GRANT ALL ON TABLE "public"."point_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."point_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."rank_history" TO "anon";
GRANT ALL ON TABLE "public"."rank_history" TO "authenticated";
GRANT ALL ON TABLE "public"."rank_history" TO "service_role";



GRANT ALL ON TABLE "public"."ranks" TO "anon";
GRANT ALL ON TABLE "public"."ranks" TO "authenticated";
GRANT ALL ON TABLE "public"."ranks" TO "service_role";



GRANT ALL ON TABLE "public"."role_change_logs" TO "anon";
GRANT ALL ON TABLE "public"."role_change_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."role_change_logs" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_types" TO "anon";
GRANT ALL ON TABLE "public"."ticket_types" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_types" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT ALL ON TABLE "public"."user_vouchers" TO "anon";
GRANT ALL ON TABLE "public"."user_vouchers" TO "authenticated";
GRANT ALL ON TABLE "public"."user_vouchers" TO "service_role";



GRANT ALL ON TABLE "public"."vouchers" TO "anon";
GRANT ALL ON TABLE "public"."vouchers" TO "authenticated";
GRANT ALL ON TABLE "public"."vouchers" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































