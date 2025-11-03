# Orochi Web - Quick Reference

> Event Management & Ticketing Platform - Quick start guide

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Run dev server
npm run dev

# 4. Visit
http://localhost:3000        # Public site
http://localhost:3000/admin  # Admin dashboard
```

---

## 📁 Key Directories

```
src/
├── app/
│   ├── (public)/          # Public pages (events, profile)
│   ├── admin/             # Admin dashboard
│   └── checkout/          # Checkout & payment
├── components/
│   ├── admin/             # Admin components
│   ├── checkout/          # Checkout components
│   └── public/            # Public components
└── lib/
    ├── supabase/          # Database clients
    ├── email.ts           # Email service (Resend)
    └── vietqr.ts          # Payment QR generation
```

---

## 🔑 Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
VIETQR_BANK_ID=
VIETQR_ACCOUNT_NO=
VIETQR_ACCOUNT_NAME=
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Optional
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

---

## 🗄️ Database Setup

```sql
-- 1. Run schema (creates all tables)
-- Copy from schema.sql → Supabase SQL Editor

-- 2. Fix triggers (SECURITY DEFINER)
-- Copy from FIX_TRIGGERS_RLS.sql → Supabase SQL Editor

-- 3. Setup storage (QR codes bucket)
-- Copy from STORAGE_SETUP.sql → Supabase SQL Editor

-- 4. (Optional) Load sample data
-- Copy from data.sql → Supabase SQL Editor
```

---

## 🎯 Core Features

### ✅ Working Features

| Feature | Public | Admin |
|---------|--------|-------|
| **Events** | Browse, Filter, View Details | Create, Edit, Delete, Publish |
| **Tickets** | Select, Checkout | View, Verify Payment |
| **Payment** | VietQR, 15-min window | Manual confirmation |
| **Orders** | Guest checkout | List, Detail, Confirm |
| **Points** | Earn on purchase, View history | - |
| **Ranks** | Auto-promotion, View benefits | - |
| **Roles** | - | Create, Edit, Permissions |

### ❌ Missing UI (Database Ready)

- Vouchers (discount codes)
- Blog system
- User management
- Ticket scanner (QR check-in)
- Event categories admin
- Reports & analytics
- Admin user management
- System settings

---

## 🔄 User Flows

### Customer Booking Flow

```
1. Browse Events (/events)
2. Click Event → View Details (/events/[slug])
3. Select Tickets → Click "Đăng ký tham gia"
4. Fill Customer Info (/checkout)
5. View Payment QR (/checkout/payment?order=xxx)
6. Transfer Money (15 minutes)
7. Receive Email with Tickets (after admin confirms)
```

### Admin Order Flow

```
1. Login (/admin/login)
2. View Orders (/admin/orders)
3. Click Order → View Details (/admin/orders/[id])
4. Check Bank Account (manual)
5. Fill Verification Form
6. Click "Xác nhận thanh toán"
7. System:
   - Creates tickets with QR codes
   - Uploads QR to Supabase Storage
   - Sends email to customer
   - Awards points to user
```

---

## 📊 Database Quick Reference

### Key Tables

```sql
-- Users & Auth
profiles           -- User profiles + points
ranks              -- Bronze, Silver, Gold...
point_transactions -- Points history

-- Events
events             -- Event listings
ticket_types       -- Ticket options & prices

-- Orders
orders             -- Customer orders
tickets            -- Individual tickets with QR

-- Admin
roles              -- Admin roles
admin_users        -- Admin accounts
permissions_catalog -- Available permissions

-- (Not Yet Used)
vouchers           -- Discount codes
blog_posts         -- Blog articles
user_vouchers      -- User's vouchers
```

### Important Functions

```sql
-- Code generation
generate_ticket_number()      -- TK-HASH-RANDOM
generate_order_number()       -- ORD-YYYYMMDD-XXX
generate_transaction_code()   -- 8 random chars

-- Points
update_profile_points_on_transaction()  -- Trigger
auto_update_user_rank()                 -- Trigger

-- Permissions
has_permission(user_id, permission)     -- Check access
get_user_permissions(user_id)           -- Get all perms
is_admin(user_id)                       -- Check if admin
```

---

## 🛠️ Common Tasks

### Add New Event (Admin)

1. Go to `/admin/events`
2. Click "Create Event"
3. Fill form:
   - Basic info (title, description)
   - Dates & location
   - Upload images (Cloudinary)
   - Add ticket types
4. Save draft or publish

### Verify Payment (Admin)

1. Customer shows bank transfer screenshot
2. Go to `/admin/orders`
3. Find order by transaction code or customer name
4. Click order → Verify details
5. Fill verification form:
   - Payment reference
   - Bank account
   - Bank name
   - Notes
6. Click "Xác nhận thanh toán"
7. Customer receives email with tickets

### Check User Points

1. User logs in
2. Go to `/profile`
3. See:
   - Current points
   - Total points
   - Rank badge
   - Recent transactions
   - Rank history

---

## 🔐 Admin Access

### Create Super Admin

```sql
-- 1. Create user via Supabase Auth

-- 2. Get user_id from auth.users table

-- 3. Get super admin role_id
SELECT id FROM roles WHERE name = 'super_admin';

-- 4. Create admin user
INSERT INTO admin_users (user_id, role_id, is_active)
VALUES ('user-uuid-here', 'role-uuid-here', true);
```

### Default Roles

- **Super Admin**: Full access
- **Event Manager**: Manage events
- **Order Manager**: Manage orders
- **User Manager**: Manage users

---

## 🐛 Troubleshooting

### Orders not creating

**Problem**: "permission denied for table users"
**Solution**: Run `FIX_TRIGGERS_RLS.sql` to add SECURITY DEFINER

### QR codes not showing in email

**Problem**: Email shows broken image
**Solution**:
1. Check Storage bucket `ticket-qr-codes` is public
2. Run `STORAGE_SETUP.sql`
3. Verify URL: `https://xxx.supabase.co/storage/v1/object/public/ticket-qr-codes/TK-xxx.png`

### Points not updating

**Problem**: Points earned but not showing in profile
**Solution**: Check trigger `trigger_update_profile_points` exists and has SECURITY DEFINER

### Payment page expired

**Problem**: Order expired before payment
**Solution**: Default 15 minutes. Extend in `createOrder()` function:
```typescript
expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
```

### Next.js Image hostname error

**Problem**: "hostname not configured"
**Solution**: Add to `next.config.ts`:
```typescript
images: {
  remotePatterns: [
    { hostname: 'res.cloudinary.com' },
    { hostname: 'img.vietqr.io' },
    { hostname: 'xxx.supabase.co' }
  ]
}
```

---

## 📝 File Quick Access

| File | Purpose |
|------|---------|
| `PROJECT_OVERVIEW.md` | Full documentation (this file) |
| `SETUP_PAYMENT_FLOW.md` | Payment setup guide |
| `QR_STORAGE_SETUP.md` | QR code storage guide |
| `BUGFIXES.md` | Bug fix history |
| `SQL_COMMANDS.md` | Database commands |
| `schema.sql` | Full database schema |
| `data.sql` | Sample data |

---

## 🔗 Important URLs

**Development**:
- Public: http://localhost:3000
- Admin: http://localhost:3000/admin
- Profile: http://localhost:3000/profile
- Events: http://localhost:3000/events

**External Services**:
- Supabase Dashboard: https://supabase.com/dashboard
- VietQR Docs: https://vietqr.io
- Resend Dashboard: https://resend.com/dashboard
- Cloudinary Console: https://cloudinary.com/console

---

## 📞 Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
# No migrations system - use Supabase SQL Editor

# Useful
rm -rf .next             # Clear Next.js cache
npm run dev -- --turbo   # Dev with Turbopack (faster)
```

---

**Last Updated**: January 2025
