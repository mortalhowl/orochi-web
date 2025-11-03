# Bug Fixes - Payment Flow

## Lỗi đã sửa:

### 1. Schema Mismatch: `location` field

**Vấn đề:**
Code đang query field `location` như một object, nhưng trong database schema, `location` được chia thành nhiều cột riêng biệt:
- `location_name`
- `location_address`
- `location_map_url`
- `location_lat`
- `location_lng`

**Các file đã sửa:**

#### a. [src/app/checkout/actions.ts](src/app/checkout/actions.ts)
- Line 43: `select('id, title, start_date, location')` → `select('id, title, start_date, location_name, location_address')`
- Line 189: Query trong `confirmOrderPayment()` từ `location` → `location_name, location_address`
- Line 315: `order.event.location?.name` → `order.event.location_name`
- Line 367: Query trong `getOrderById()` từ `location` → `location_name, location_address`

#### b. [src/components/checkout/payment-view.tsx](src/components/checkout/payment-view.tsx)
- Line 192-193: `order.event.location?.name` và `order.event.location.name` → `order.event.location_name`

#### c. [src/components/admin/order-detail-view.tsx](src/components/admin/order-detail-view.tsx)
- Line 147: `order.event.location?.name` và `order.event.location.name` → `order.event.location_name`

**Impact:**
- Các trang hiện có thể load được order data
- Payment page không còn crash
- Admin order detail page hoạt động bình thường

---

## Các điểm cần lưu ý:

### 1. Database Schema vs Code
Luôn kiểm tra schema thực tế trong database trước khi viết query. Sử dụng:
\`\`\`sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'events';
\`\`\`

### 2. Type Definitions
Nếu có file types, cần cập nhật để match với schema:
\`\`\`typescript
// src/types/events.types.ts
export type Event = {
  // ...
  location_name: string | null
  location_address: string | null
  location_map_url: string | null
  location_lat: number | null
  location_lng: number | null
  // NOT: location: { name, address, ... }
}
\`\`\`

### 3. Migration Strategy
Nếu muốn sử dụng JSONB object `location` thay vì nhiều cột:
\`\`\`sql
ALTER TABLE events ADD COLUMN location JSONB;
UPDATE events SET location = jsonb_build_object(
  'name', location_name,
  'address', location_address,
  'map_url', location_map_url,
  'lat', location_lat,
  'lng', location_lng
);
-- Then drop old columns if needed
\`\`\`

---

## Testing Checklist:

- [x] Checkout page loads
- [x] Create order works
- [x] Payment page displays QR code
- [x] Admin can view orders
- [x] Admin can view order details
- [ ] Admin can confirm payment (test this!)
- [ ] Email is sent after confirmation (test this!)

---

## Next Steps:

1. Test flow đầy đủ từ đầu đến cuối
2. Verify SQL function `increment_ticket_sold_count` đã được tạo trong database
3. Test email sending với Resend
4. Kiểm tra RLS policies
