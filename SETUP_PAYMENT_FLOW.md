# Hướng dẫn Setup Luồng Thanh Toán và Gửi Vé

## 📋 Tổng quan

Luồng thanh toán mới được triển khai như sau:

1. **Khách hàng chọn vé** → Điền thông tin → Tạo đơn hàng
2. **Hệ thống tạo mã QR VietQR** động với mã giao dịch duy nhất
3. **Khách hàng thanh toán** qua VietQR hoặc chuyển khoản thủ công
4. **Admin xác nhận thanh toán** thủ công trên hệ thống
5. **Hệ thống tự động**:
   - Tạo vé điện tử với QR code
   - Cộng điểm thưởng cho user
   - Gửi email vé về cho khách hàng

---

## 🔧 Bước 1: Cấu hình Environment Variables

### 1.1. Copy file .env.example

\`\`\`bash
cp .env.example .env.local
\`\`\`

### 1.2. Điền thông tin VietQR

**Lấy mã ngân hàng:**
- Truy cập: https://api.vietqr.io/v2/banks
- Tìm ngân hàng của bạn và lấy mã `bin` (ví dụ: MBBank = "970422")

**Cấu hình:**
\`\`\`env
VIETQR_BANK_ID=970422           # Mã ngân hàng
VIETQR_ACCOUNT_NO=0123456789    # Số tài khoản nhận tiền
VIETQR_ACCOUNT_NAME=NGUYEN_VAN_A  # Tên tài khoản (không dấu, viết hoa)
VIETQR_TEMPLATE=compact         # Template QR (compact/print/qr_only)
\`\`\`

### 1.3. Cấu hình Resend Email

**Đăng ký Resend:**
1. Truy cập: https://resend.com
2. Đăng ký tài khoản miễn phí (100 emails/ngày)
3. Tạo API Key từ dashboard
4. Verify domain (hoặc dùng sandbox domain để test)

**Cấu hình:**
\`\`\`env
RESEND_API_KEY=re_abc123xyz...   # API key từ Resend dashboard
RESEND_FROM_EMAIL=noreply@yourdomain.com  # Email gửi đi
\`\`\`

**Lưu ý:**
- Nếu chưa verify domain, dùng email test: `onboarding@resend.dev`
- Email sẽ chỉ gửi được đến email đã verify trong Resend dashboard (miễn phí)

---

## 🗄️ Bước 2: Chạy SQL Commands trên Supabase

### 2.1. Truy cập Supabase SQL Editor

1. Đăng nhập vào Supabase Dashboard
2. Chọn project của bạn
3. Vào **SQL Editor** (menu bên trái)
4. Tạo **New Query**

### 2.2. Chạy các lệnh SQL sau

#### A. Tạo function để tăng sold_count của ticket types

\`\`\`sql
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

-- Set owner
ALTER FUNCTION "public"."increment_ticket_sold_count"("ticket_type_id" "uuid", "increment_by" integer)
OWNER TO "postgres";
\`\`\`

**Click "Run" để execute.**

#### B. Verify các functions khác đã tồn tại

Kiểm tra các functions sau đã có trong database chưa:

\`\`\`sql
-- Kiểm tra danh sách functions
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'generate_order_number',
  'generate_ticket_code',
  'generate_ticket_number',
  'generate_transaction_code'
)
ORDER BY routine_name;
\`\`\`

Kết quả phải có 4 functions:
- ✅ `generate_order_number` - Tạo mã đơn hàng (ORD-YYYYMMDD-XXX)
- ✅ `generate_ticket_code` - Tạo mã vé (TKT-EVENTCODE-XXXX)
- ✅ `generate_ticket_number` - Tạo số vé (TKT-YYYYMMDD-XXXX)
- ✅ `generate_transaction_code` - Tạo mã giao dịch (8 ký tự)

**Nếu thiếu, import lại từ file `schema.sql`**

### 2.3. Kiểm tra cấu trúc bảng orders

\`\`\`sql
-- Kiểm tra các cột liên quan đến VietQR
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN (
  'payment_qr_code',
  'payment_reference',
  'payment_bank_account',
  'payment_bank_name',
  'payment_expires_at',
  'transaction_code',
  'expires_at'
)
ORDER BY column_name;
\`\`\`

**Tất cả các cột này phải tồn tại. Nếu không, cần migrate schema.**

---

## �� Bước 3: Cài đặt Dependencies

Đã được cài đặt trong quá trình triển khai:

\`\`\`bash
npm install resend qrcode @types/qrcode
\`\`\`

**Packages:**
- `resend` - Email service
- `qrcode` - Tạo QR code cho vé
- `@types/qrcode` - TypeScript types

---

## 🚀 Bước 4: Deploy và Test

### 4.1. Build và chạy local

\`\`\`bash
npm run dev
\`\`\`

### 4.2. Test Flow đầy đủ

#### **Bước 1: Chọn vé (User)**

1. Vào trang event: `http://localhost:3000/events/[slug]`
2. Chọn số lượng vé và click **"Đăng ký tham gia"**
3. Điền thông tin khách hàng
4. Click **"Tiếp tục thanh toán"**

#### **Bước 2: Thanh toán (User)**

1. Trang payment sẽ hiển thị:
   - Mã QR VietQR động
   - Thông tin chuyển khoản thủ công
   - Mã giao dịch (transaction_code)
   - Countdown 15 phút

2. Test thanh toán:
   - **Production**: Quét QR bằng app ngân hàng
   - **Test**: Copy thông tin chuyển khoản để admin verify

#### **Bước 3: Xác nhận thanh toán (Admin)**

1. Login admin: `http://localhost:3000/admin/login`

2. Vào **Quản lý đơn hàng**: `/admin/orders?status=pending`

3. Click vào đơn hàng cần xác nhận

4. Điền thông tin verification:
   - Mã giao dịch ngân hàng (optional)
   - Số tiền thực nhận
   - Ngày giao dịch
   - Ghi chú

5. Click **"Xác nhận thanh toán & Gửi vé"**

#### **Bước 4: Kiểm tra kết quả**

Sau khi xác nhận, hệ thống sẽ tự động:

✅ Cập nhật order status: `paid`, `confirmed`
✅ Tạo tickets với QR code
✅ Cộng điểm thưởng cho user (nếu có)
✅ Gửi email vé về cho khách hàng

**Kiểm tra email:**
- Mở email khách hàng
- Email subject: `🎫 Vé sự kiện [Event Title] - [Order Number]`
- Email chứa:
  - Thông tin sự kiện
  - Danh sách vé với QR code
  - Hướng dẫn sử dụng

---

## 📧 Bước 5: Cấu hình Email Template (Optional)

Nếu muốn customize email template:

1. Mở file: `src/lib/email.ts`
2. Chỉnh sửa function `generateTicketEmailHtml()`
3. Thay đổi HTML/CSS theo brand của bạn

**Template hiện tại bao gồm:**
- Header với logo và title
- Thông tin sự kiện
- Danh sách vé với QR code
- Footer với lưu ý quan trọng

---

## 🔐 Bước 6: Cấu hình Row Level Security (RLS)

### 6.1. Policy cho bảng orders

\`\`\`sql
-- Allow users to view their own orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

-- Allow authenticated users to create orders
CREATE POLICY "Authenticated users can create orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow admins to update orders
CREATE POLICY "Admins can update orders"
ON orders FOR UPDATE
USING (is_admin(auth.uid()));
\`\`\`

### 6.2. Policy cho bảng tickets

\`\`\`sql
-- Allow users to view tickets from their orders
CREATE POLICY "Users can view own tickets"
ON tickets FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
  )
);

-- Allow admins to manage tickets
CREATE POLICY "Admins can manage tickets"
ON tickets FOR ALL
USING (is_admin(auth.uid()));
\`\`\`

---

## 🐛 Troubleshooting

### Lỗi: "Missing VietQR configuration"

**Nguyên nhân:** Chưa set environment variables
**Giải pháp:** Kiểm tra file `.env.local` đã có đầy đủ biến VietQR chưa

### Lỗi: "Failed to send email"

**Nguyên nhân:**
- API key không đúng
- Email chưa được verify trong Resend
- Đã vượt quá quota (100 emails/ngày với free tier)

**Giải pháp:**
1. Kiểm tra API key trong Resend dashboard
2. Verify email domain hoặc dùng `onboarding@resend.dev` để test
3. Upgrade plan nếu cần gửi nhiều email hơn

### Lỗi: "Cannot find function increment_ticket_sold_count"

**Nguyên nhân:** Chưa chạy SQL command tạo function
**Giải pháp:** Chạy lại SQL ở Bước 2.2

### QR Code không hiển thị

**Nguyên nhân:**
- VIETQR_BANK_ID không đúng
- Số tài khoản sai

**Giải pháp:**
1. Kiểm tra mã ngân hàng tại: https://api.vietqr.io/v2/banks
2. Verify số tài khoản và tên tài khoản

### Email không đến

**Nguyên nhân:**
- Vào spam folder
- Email chưa verify trong Resend
- API key hết hạn

**Giải pháp:**
1. Kiểm tra spam/junk folder
2. Verify domain trong Resend dashboard
3. Tạo API key mới nếu cần

---

## 📝 Checklist Trước Khi Production

- [ ] Đã cấu hình đầy đủ environment variables
- [ ] Đã chạy tất cả SQL migrations
- [ ] Đã test flow đầy đủ: chọn vé → thanh toán → xác nhận → nhận email
- [ ] Đã verify email domain trên Resend
- [ ] Đã cấu hình RLS policies
- [ ] Đã test thanh toán thực tế với ngân hàng
- [ ] Đã kiểm tra email template hiển thị đúng trên các email clients
- [ ] Đã setup monitoring/logging cho production
- [ ] Đã có plan backup database
- [ ] Đã thông báo cho khách hàng về luồng thanh toán mới

---

## 🔗 Tài liệu tham khảo

- VietQR API: https://api.vietqr.io/docs
- Resend Docs: https://resend.com/docs
- Supabase Functions: https://supabase.com/docs/guides/database/functions
- QRCode.js: https://github.com/soldair/node-qrcode

---

## 🆘 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:

1. **Server logs**: `npm run dev` output
2. **Browser console**: DevTools → Console
3. **Supabase logs**: Dashboard → Logs
4. **Resend logs**: Dashboard → Logs

Hoặc liên hệ team support.
