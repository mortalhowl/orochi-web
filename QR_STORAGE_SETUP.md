# QR Code Storage Setup Guide

## Thay đổi chính

### 1. QR Code giờ được lưu trên Supabase Storage
- **Trước**: QR code được encode thành base64 string (~200KB mỗi QR)
- **Sau**: QR code được upload lên Supabase Storage bucket và dùng public URL trong email
- **Lợi ích**:
  - Email nhẹ hơn, load nhanh hơn
  - QR code hiển thị chính xác trên mọi email client
  - Dễ quản lý và xóa QR codes cũ

### 2. Order hết hạn redirect về trang chủ
- **Trước**: Hiển thị trang expired với nút quay lại event
- **Sau**: Tự động redirect về trang chủ (`/`) khi order hết hạn (15 phút)

---

## Setup Instructions

### Bước 1: Tạo Storage Bucket trên Supabase

Chạy file `STORAGE_SETUP.sql` trên Supabase SQL Editor:

```bash
# File đã được tạo tại: STORAGE_SETUP.sql
```

Hoặc tạo thủ công:
1. Vào Supabase Dashboard → **Storage**
2. Click **Create a new bucket**
3. Name: `ticket-qr-codes`
4. **Public**: ✅ YES (để có thể access trực tiếp)
5. Click **Create bucket**

### Bước 2: Verify Configuration

Check `next.config.ts` đã có hostname Supabase:

```typescript
{
  protocol: 'https',
  hostname: 'kxrdyuzdbbevtljicqmn.supabase.co',
  pathname: '/storage/v1/object/public/**',
}
```

### Bước 3: Test Flow

1. **Tạo order mới**:
   - Chọn vé tại `/events/[slug]`
   - Điền thông tin checkout
   - Submit order

2. **Admin confirm payment**:
   - Vào `/admin/orders`
   - Click vào order
   - Click "Xác nhận thanh toán"

3. **Check email**:
   - QR code giờ sẽ là `<img src="https://kxrdyuzdbbevtljicqmn.supabase.co/storage/v1/object/public/ticket-qr-codes/TICKET-xxxxx.png" />`
   - Thay vì base64 data URL

4. **Test expiration**:
   - Đợi 15 phút sau khi tạo order
   - Access `/checkout/payment?order=xxx`
   - Sẽ tự động redirect về `/`

---

## Files Changed

### 1. `src/app/checkout/actions.ts` (Line 270-309)
- Changed từ `QRCode.toDataURL()` sang `QRCode.toBuffer()`
- Upload QR buffer lên Supabase Storage
- Lưu public URL vào database thay vì base64

### 2. `src/app/checkout/payment/page.tsx` (Line 28-34)
- Redirect về `/` thay vì render expired message

### 3. `next.config.ts` (Line 16-20)
- Thêm Supabase Storage hostname vào remotePatterns

### 4. New Files
- `STORAGE_SETUP.sql`: SQL để tạo bucket và RLS policies
- `QR_STORAGE_SETUP.md`: Tài liệu này

---

## Storage Policies

Bucket `ticket-qr-codes` có 3 policies:

1. **Public Read**: Ai cũng có thể xem QR codes (để hiển thị trong email)
2. **Service Upload**: Chỉ authenticated users (system) có thể upload
3. **Service Delete**: Chỉ service role có thể xóa QR codes

---

## Monitoring & Maintenance

### Check Storage Usage
```sql
-- Check số lượng QR codes
SELECT COUNT(*) FROM storage.objects
WHERE bucket_id = 'ticket-qr-codes';

-- Check total size
SELECT
  bucket_id,
  COUNT(*) as total_files,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
WHERE bucket_id = 'ticket-qr-codes'
GROUP BY bucket_id;
```

### Clean Up Old QR Codes (Optional)
```sql
-- Delete QR codes của tickets đã dùng (checked-in) sau 30 ngày
DELETE FROM storage.objects
WHERE bucket_id = 'ticket-qr-codes'
AND name IN (
  SELECT ticket_number || '.png'
  FROM tickets
  WHERE status = 'used'
  AND checked_in_at < NOW() - INTERVAL '30 days'
);
```

---

## Troubleshooting

### QR không hiển thị trong email
1. Check bucket có public không: Supabase Storage → `ticket-qr-codes` → Settings → Public Access = ON
2. Check RLS policies đã được tạo chưa
3. Test URL trực tiếp: `https://kxrdyuzdbbevtljicqmn.supabase.co/storage/v1/object/public/ticket-qr-codes/TICKET-xxxxx.png`

### Upload failed
1. Check Supabase Storage quota (Free tier: 1GB)
2. Check network connection
3. Check logs: `console.error('Error uploading QR code:', uploadError)`

### Next.js Image Error
- Restart dev server sau khi thay đổi `next.config.ts`
- Clear `.next` cache: `rm -rf .next`
