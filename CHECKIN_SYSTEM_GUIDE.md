# QR Check-in System Guide

> Hệ thống quét QR code để check-in vé tham dự sự kiện

---

## 🎯 Overview

Hệ thống check-in cho phép admin quét mã QR trên vé để xác nhận người tham dự đã có mặt tại sự kiện. Mỗi vé có mã QR duy nhất, chỉ được sử dụng một lần.

### Key Features

✅ **QR Scanner với Camera**
- Quét QR code tự động
- Hỗ trợ camera trước/sau
- Live preview

✅ **Ticket Validation**
- Kiểm tra vé hợp lệ
- Phát hiện vé đã sử dụng
- Kiểm tra thời gian sự kiện
- Check-in window: 2h trước sự kiện

✅ **Check-in Confirmation**
- Hiển thị thông tin vé đầy đủ
- Thông tin người tham dự
- Thông tin sự kiện
- Trạng thái check-in

✅ **History & Stats**
- Lịch sử check-in gần đây
- Thống kê check-in trong ngày
- Log đầy đủ trong database

---

## 📁 Files Created

### Server Actions
**`src/app/admin/(protected)/tickets/actions.ts`**
```typescript
// Main functions:
- checkInTicket(ticketNumber, adminUserId, notes?)
  → Validates and checks in a ticket

- getTicketInfo(ticketNumber)
  → Preview ticket without checking in

- getRecentCheckIns(limit)
  → Get recent check-ins for display

- getCheckInStats(eventId?)
  → Get check-in statistics
```

### Components
**`src/components/admin/qr-scanner.tsx`**
- QR code scanner using html5-qrcode library
- Auto-starts camera on mount
- Calls onScanSuccess when QR detected

**`src/components/admin/checkin-result.tsx`**
- Modal displaying check-in result
- Shows ticket details
- Success/error states

### Pages
**`src/app/admin/(protected)/tickets/scan/page.tsx`**
- Main check-in page
- Camera scanner
- Stats display
- Recent check-ins list

---

## 🚀 Usage

### 1. Access Scanner

```
Admin Dashboard → Vé → Quét QR
URL: /admin/tickets/scan
```

### 2. Check-in Flow

```
1. Page loads → Camera starts automatically
2. Point camera at ticket QR code
3. QR detected → Auto scan
4. System validates ticket:
   - ✅ Valid → Check-in success
   - ❌ Already used → Show error
   - ❌ Cancelled/Expired → Show error
   - ❌ Too early/late → Show error
5. Display result modal with ticket details
6. Close modal → Ready for next scan
```

### 3. Validation Rules

**Ticket Status Check**:
- ✅ `valid` → Allow check-in
- ❌ `used` → Already checked in
- ❌ `cancelled` → Ticket cancelled
- ❌ `expired` → Ticket expired

**Time Window Check**:
- ✅ Within 2 hours before event start → Allow
- ✅ During event (start to end) → Allow
- ❌ More than 2 hours before → Too early
- ❌ After event end → Event ended

**Example**:
```
Event: 2025-01-15 19:00 - 22:00

Check-in allowed from:
  2025-01-15 17:00 (2h before)
  to 2025-01-15 22:00 (event end)
```

---

## 🔧 Technical Details

### Dependencies

```bash
npm install html5-qrcode
```

### Database Updates

**Ticket Status Update**:
```sql
UPDATE tickets
SET
  status = 'used',
  checked_in_at = NOW(),
  checked_in_by = 'admin_user_id',
  checked_in_notes = 'optional notes'
WHERE ticket_number = 'TK-XXXXXXXX-YYYYYY';
```

**Check-in Log**:
```sql
INSERT INTO checkin_logs (
  ticket_id,
  event_id,
  checked_in_by,
  checked_in_at,
  notes
) VALUES (...);
```

### QR Code Format

Ticket QR codes contain the ticket number:
```
Format: TK-XXXXXXXX-YYYYYY
Example: TK-A3F8B9C2-X7Y4Z1

- TK: Prefix
- XXXXXXXX: MD5 hash (8 chars)
- YYYYYY: Random (6 chars)
```

---

## 🎨 UI Components

### Scanner Page Layout

```
┌─────────────────────────────────┐
│  📊 Stats Cards                 │
│  [Checked In] [Pending] [History]│
├─────────────────────────────────┤
│  📷 Camera Scanner              │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │    [Camera Preview]     │   │
│  │                         │   │
│  └─────────────────────────┘   │
│  [Stop/Start Button]            │
│  📝 Instructions                │
├─────────────────────────────────┤
│  📋 Recent Check-ins            │
│  • Holder Name - Event - Time  │
│  • ...                          │
└─────────────────────────────────┘
```

### Result Modal

```
┌─────────────────────────────────┐
│        ✅ Check-in Success!      │
│                                 │
│  📱 Ticket Details              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Mã vé: TK-XXX-YYY              │
│  Người tham dự: John Doe        │
│  Email: john@example.com        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Sự kiện: Event Name            │
│  Thời gian: 15/01/2025 19:00    │
│  Địa điểm: Venue Name           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Loại vé: VIP                   │
│  Trạng thái: ✅ Đã check-in     │
│                                 │
│  [Quét vé tiếp theo]            │
└─────────────────────────────────┘
```

---

## 🔐 Security

### Validation Checks

1. **Ticket Exists**: Query database for ticket_number
2. **Not Cancelled**: Check status != 'cancelled'
3. **Not Used**: Check status != 'used'
4. **Time Window**: 2h before to event end
5. **Event Match**: Ensure ticket for correct event
6. **One-Time Use**: Update status to 'used' after check-in

### Admin Authentication

- Only authenticated admin users can access scanner
- Admin user ID logged in check-in records
- Protected route: `(protected)` group

---

## 📊 Database Schema

### Tables Used

**tickets**:
```sql
- ticket_number (TEXT, UNIQUE) -- Scanned from QR
- status (TEXT) -- valid, used, cancelled, expired
- checked_in_at (TIMESTAMP) -- Check-in time
- checked_in_by (UUID) -- Admin user ID
- checked_in_notes (TEXT) -- Optional notes
```

**checkin_logs**:
```sql
- id (UUID, PK)
- ticket_id (UUID, FK)
- event_id (UUID, FK)
- checked_in_by (UUID, FK to auth.users)
- checked_in_at (TIMESTAMP)
- notes (TEXT)
```

---

## 🐛 Troubleshooting

### Camera Not Working

**Problem**: "Không tìm thấy camera"

**Solutions**:
1. Check browser permissions (Allow camera access)
2. Use HTTPS (camera requires secure context)
3. Check if camera is being used by another app
4. Try different browser (Chrome, Firefox, Safari)

**Mobile**:
- Safari iOS: Settings → Safari → Camera → Allow
- Chrome Android: Settings → Site settings → Camera → Allow

### QR Not Scanning

**Problem**: QR code not detected

**Solutions**:
1. Ensure good lighting
2. Hold camera steady
3. Keep QR code in focus
4. Make sure QR is not damaged/blurred
5. Try different distance (closer/farther)

### Ticket Already Used

**Problem**: "Vé đã được sử dụng"

**Solution**:
- This is expected behavior (one-time use)
- Check `checkin_logs` for when it was used:
  ```sql
  SELECT * FROM checkin_logs
  WHERE ticket_id = (
    SELECT id FROM tickets
    WHERE ticket_number = 'TK-XXX-YYY'
  );
  ```
- If duplicate/error, admin can manually reset in database

### Check-in Too Early

**Problem**: "Chưa đến giờ check-in"

**Solution**:
- Check-in opens 2 hours before event
- Wait until check-in window opens
- Or adjust time window in code:
  ```typescript
  // In actions.ts
  const checkInWindowStart = new Date(
    eventStart.getTime() - 2 * 60 * 60 * 1000 // Change to 3 hours
  )
  ```

---

## 📈 Statistics & Reporting

### View Check-in Stats

**Today's Check-ins**:
```sql
SELECT COUNT(*)
FROM checkin_logs
WHERE DATE(checked_in_at) = CURRENT_DATE;
```

**By Event**:
```sql
SELECT
  e.title,
  COUNT(cl.id) as checked_in,
  (SELECT COUNT(*) FROM tickets WHERE event_id = e.id) as total
FROM events e
LEFT JOIN checkin_logs cl ON cl.event_id = e.id
GROUP BY e.id, e.title;
```

**By Time**:
```sql
SELECT
  DATE_TRUNC('hour', checked_in_at) as hour,
  COUNT(*) as check_ins
FROM checkin_logs
WHERE event_id = 'event-uuid-here'
GROUP BY hour
ORDER BY hour;
```

---

## 🎯 Best Practices

### For Admins

1. **Test Scanner**: Test before event starts
2. **Good Lighting**: Ensure venue has adequate lighting
3. **Backup Plan**: Have manual check-in list ready
4. **Multiple Devices**: Use multiple tablets/phones for busy events
5. **Monitor Stats**: Check check-in progress regularly

### For Setup

1. **HTTPS Required**: Camera API needs HTTPS
2. **Mobile First**: Design works best on tablets
3. **Offline Support**: Consider adding offline mode (future)
4. **Battery**: Keep devices charged
5. **Network**: Ensure stable internet for database updates

---

## 🔄 Future Enhancements

### Planned Features

- [ ] Offline mode with sync
- [ ] Multiple scanner instances
- [ ] Real-time stats dashboard
- [ ] Export check-in data to CSV
- [ ] Print check-in reports
- [ ] Push notifications for organizers
- [ ] Face recognition for VIP
- [ ] Bulk check-in for groups

### API Endpoints (Future)

```typescript
POST /api/checkin/scan
  → Check in a ticket

GET /api/checkin/stats/:eventId
  → Get event check-in stats

GET /api/checkin/export/:eventId
  → Export check-in data (CSV)
```

---

## 📞 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| Camera black screen | Check browser permissions |
| QR not scanning | Improve lighting, focus |
| Already checked in | Expected, ticket is one-time use |
| Wrong event | Ticket is for different event |
| Expired ticket | Event has ended |

### Contact

For technical support, check:
- Database logs: `checkin_logs` table
- Console errors: Browser DevTools
- Server logs: Check terminal output

---

**Created**: January 2025
**Version**: 1.0.0
