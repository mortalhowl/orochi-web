# SQL Commands cần chạy trên Supabase

## ⚠️ QUAN TRỌNG: Chạy các lệnh này trên Supabase SQL Editor

### 1. Tạo function để tăng sold_count của ticket types

```sql
CREATE OR REPLACE FUNCTION "public"."increment_ticket_sold_count"(
  "ticket_type_id" "uuid",
  "increment_by" integer DEFAULT 1
) RETURNS "void"
LANGUAGE "plpgsql"
AS $$
BEGIN
  UPDATE ticket_types
  SET sold_count = sold_count + increment_by
  WHERE id = ticket_type_id;
END;
$$;

ALTER FUNCTION "public"."increment_ticket_sold_count"("ticket_type_id" "uuid", "increment_by" integer)
OWNER TO "postgres";
```

### 2. Kiểm tra các functions cần thiết đã tồn tại

Chạy query này để kiểm tra:

```sql
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'generate_order_number',
  'generate_ticket_code',
  'generate_ticket_number',
  'generate_transaction_code',
  'increment_ticket_sold_count'
)
ORDER BY routine_name;
```

**Kết quả mong đợi:** Phải có đầy đủ 5 functions

### 3. Nếu thiếu function generate_transaction_code, chạy lệnh này:

```sql
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
```

### 4. Kiểm tra trigger generate order_number

```sql
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'orders';
```

**Nếu không có trigger `set_order_number_trigger`, tạo trigger:**

```sql
-- Đảm bảo function generate_order_number tồn tại
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

-- Tạo trigger để tự động tạo order_number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number_trigger ON orders;

CREATE TRIGGER set_order_number_trigger
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_order_number();
```

### 5. Tương tự cho transaction_code

```sql
CREATE OR REPLACE FUNCTION set_transaction_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_code IS NULL THEN
    NEW.transaction_code := generate_transaction_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_transaction_code_trigger ON orders;

CREATE TRIGGER set_transaction_code_trigger
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_transaction_code();
```

### 6. Test functions

```sql
-- Test generate_transaction_code
SELECT generate_transaction_code();

-- Test generate_order_number
SELECT generate_order_number();

-- Test increment_ticket_sold_count
-- (Cần có ticket_type_id thực tế)
-- SELECT increment_ticket_sold_count('your-ticket-type-id-here', 1);
```

---

## 📝 Checklist

Sau khi chạy các lệnh trên, check lại:

- [ ] Function `increment_ticket_sold_count` đã tồn tại
- [ ] Function `generate_transaction_code` đã tồn tại
- [ ] Function `generate_order_number` đã tồn tại
- [ ] Trigger `set_order_number_trigger` đã tồn tại
- [ ] Trigger `set_transaction_code_trigger` đã tồn tại
- [ ] Test tất cả functions hoạt động

---

## 🔍 Debug: Kiểm tra lỗi khi tạo order

Nếu vẫn gặp lỗi, check logs trong Supabase:

1. Vào Supabase Dashboard → Database → Logs
2. Hoặc chạy query để xem errors:

```sql
SELECT * FROM pg_stat_statements
WHERE query LIKE '%orders%'
ORDER BY calls DESC
LIMIT 10;
```
