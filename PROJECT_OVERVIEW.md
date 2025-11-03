# OROCHI WEB - Project Documentation

> **Event Management & Ticketing Platform**
> Built with Next.js 16, Supabase, VietQR Payment Integration

**Version**: 1.0.0
**Last Updated**: January 2025

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Features](#2-core-features-implemented)
3. [Technology Stack](#3-technology-stack)
4. [Project Architecture](#4-project-architecture)
5. [Database Schema](#5-database-schema)
6. [API & Server Actions](#6-api--server-actions)
7. [Missing Features](#7-missing-features--todos)
8. [Setup Instructions](#8-setup-instructions)
9. [Development Guide](#9-development-guide)

---

## 1. Project Overview

**Orochi Web** is a comprehensive event management and ticketing platform designed for Vietnamese market with:
- Public event discovery and ticket booking
- VietQR integration for bank transfer payments
- Admin dashboard for event and order management
- Points & rank system for customer loyalty
- Role-based access control for admin users

### Key Statistics

- **Pages**: 23 (12 public, 11 admin)
- **Components**: 33 React components
- **Server Actions**: 15 action files
- **Database Tables**: 20+ tables with RLS
- **Triggers & Functions**: 25+ database functions

### Project Goals

1. ✅ Provide seamless event booking experience
2. ✅ Support manual payment verification via VietQR
3. ✅ Enable loyalty rewards through points system
4. ✅ Offer flexible admin management tools
5. ⏳ Build comprehensive analytics and reporting

---

## 2. Core Features Implemented

### ✅ Authentication System
**Location**: `src/app/auth/`, `src/components/auth/`

- **Google OAuth**: Sign in with Google
- **Email/Password**: Admin authentication
- **Profile Management**: User profiles with avatar and rank
- **Role-Based Access Control**: Flexible permission system
- **Auto Profile Creation**: Triggered on signup

**Key Files**:
- `src/app/auth/actions.ts` - Auth server actions
- `src/components/auth/google-signin-button.tsx`
- `src/components/auth/user-nav.tsx`

---

### ✅ Event Management
**Location**: `src/app/admin/(protected)/events/`

**Public Features**:
- Browse events with filters (category, status, search)
- Event detail pages with rich content
- Related events suggestions
- Ticket selection interface

**Admin Features**:
- Full CRUD operations
- Rich text editor (TipTap) for descriptions
- Multiple ticket types per event
- Image upload (Cloudinary integration)
- Event statistics tracking

**Key Files**:
- `src/app/(public)/events/` - Public pages
- `src/app/admin/(protected)/events/` - Admin pages
- `src/components/admin/event-form.tsx`
- `src/components/admin/ticket-types-editor.tsx`

---

### ✅ Ticket Booking & Checkout
**Location**: `src/app/checkout/`

**Flow**:
1. User selects tickets → Checkout page
2. Fills customer information
3. Creates order with 15-minute expiration
4. Redirected to payment page with VietQR code

**Features**:
- Guest checkout (no login required)
- Multiple ticket types in one order
- Real-time price calculation
- Automatic order expiration

**Key Files**:
- `src/app/checkout/page.tsx`
- `src/components/checkout/checkout-form.tsx`
- `src/components/public/ticket-selector.tsx`

---

### ✅ VietQR Payment Integration
**Location**: `src/lib/vietqr.ts`, `src/app/checkout/`

**Features**:
- Dynamic QR code generation with amount
- Unique transaction code per order (8 characters)
- Manual payment verification by admin
- 15-minute payment window
- Automatic redirect on expiration

**Flow**:
1. System generates VietQR URL with order amount
2. Customer scans QR and transfers money
3. Admin checks bank account and verifies
4. System creates tickets and sends email

**Key Files**:
- `src/lib/vietqr.ts` - VietQR URL generation
- `src/app/checkout/payment/page.tsx`
- `src/components/checkout/payment-view.tsx`

---

### ✅ Order Management
**Location**: `src/app/admin/(protected)/orders/`

**Features**:
- Order listing with filters (payment status)
- Order detail view with full information
- Payment verification form
- Manual payment confirmation
- Order activity logs

**Admin Actions**:
- Confirm payment → Creates tickets → Sends email
- View order details
- Add verification notes
- Track order activities

**Key Files**:
- `src/app/admin/(protected)/orders/page.tsx`
- `src/components/admin/orders-table.tsx`
- `src/components/admin/order-detail-view.tsx`

---

### ✅ Ticket System
**Location**: Database schema, Supabase Storage

**Features**:
- Secure ticket number: `TK-HASH-RANDOM` format
- QR codes stored in Supabase Storage (not base64)
- Email delivery with QR code images
- Check-in status tracking
- Ticket holder information

**Security**:
- Ticket numbers use MD5 hash + random
- QR codes are unique and unguessable
- Public URL access for email embedding

**Storage**:
- Bucket: `ticket-qr-codes`
- Public read access
- Format: `TK-XXXXXXXX-YYYYYY.png`

---

### ✅ Email Notifications
**Location**: `src/lib/email.ts`

**Resend Integration**:
- HTML email templates
- Ticket delivery with QR codes
- Event information included
- Order summary

**Email Template Includes**:
- Customer name and order details
- Event information (title, date, location)
- Multiple ticket QR codes (one per ticket)
- Holder names for each ticket
- Important notes and instructions

**Key Files**:
- `src/lib/email.ts` - Email service and templates

---

### ✅ Points & Rank System
**Location**: `src/app/(public)/profile/`, Database functions

**Points Features**:
- Automatic points on ticket purchase
- Transaction history tracking
- Points balance (current, total, lifetime)
- Configurable point rules

**Rank Features**:
- 5 default ranks: Bronze, Silver, Gold, Platinum, Diamond
- Automatic rank progression based on total points
- Rank benefits: Point multipliers, discounts
- Rank change history
- Visual badges in profile

**How It Works**:
1. User buys tickets → Earns points
2. Trigger updates profile points
3. Another trigger checks rank eligibility
4. Auto-promotes user if qualified
5. Logs rank change to history

**Key Files**:
- `src/app/(public)/profile/page.tsx`
- `src/app/(public)/profile/actions.ts`
- Database: `update_profile_points_on_transaction()`
- Database: `auto_update_user_rank()`

---

### ✅ Admin Dashboard
**Location**: `src/app/admin/(protected)/dashboard/`

**Statistics Cards**:
- Total events published
- Total tickets sold
- Total revenue (weekly)
- Total users

**Recent Activity**:
- Latest 5 orders with status
- Latest 5 events with attendee counts

**Quick Actions**:
- Create event
- Scan QR code (planned)
- Create voucher (planned)
- View reports (planned)

**Key Files**:
- `src/app/admin/(protected)/dashboard/page.tsx`
- `src/components/layout/admin-layout-client.tsx`

---

### ✅ Role-Based Access Control
**Location**: `src/app/admin/(protected)/roles/`

**Features**:
- Multiple admin roles
- Granular permissions
- Custom permissions per admin user
- System-protected super admin role
- Permission catalog

**Permissions System**:
- `events.create`, `events.update`, `events.delete`
- `orders.view`, `orders.confirm`
- `users.view`, `users.edit`
- And more...

**Key Files**:
- `src/app/admin/(protected)/roles/`
- Database: `has_permission()`, `get_user_permissions()`

---

## 3. Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Rich Text Editor**: TipTap
- **Image Upload**: Cloudinary
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Google OAuth
- **Storage**: Supabase Storage
- **Email**: Resend
- **Payment**: VietQR API
- **QR Generation**: qrcode library

### DevOps
- **Package Manager**: npm
- **Version Control**: Git
- **Deployment**: (Not configured yet)

---

## 4. Project Architecture

### Directory Structure

```
orochi-web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (public)/            # Public pages (no auth)
│   │   │   ├── events/          # Event listing & details
│   │   │   ├── profile/         # User profile
│   │   │   └── layout.tsx       # Public layout
│   │   ├── admin/               # Admin section
│   │   │   ├── (protected)/     # Protected admin pages
│   │   │   │   ├── dashboard/   # Admin dashboard
│   │   │   │   ├── events/      # Event management
│   │   │   │   ├── orders/      # Order management
│   │   │   │   ├── roles/       # Role management
│   │   │   │   └── layout.tsx   # Admin layout
│   │   │   └── login/           # Admin login
│   │   ├── checkout/            # Checkout flow
│   │   │   ├── payment/         # Payment page
│   │   │   └── actions.ts       # Checkout actions (400+ lines)
│   │   └── auth/                # Auth callbacks
│   ├── components/              # React components
│   │   ├── admin/               # Admin-specific
│   │   ├── auth/                # Authentication
│   │   ├── checkout/            # Checkout flow
│   │   ├── layout/              # Layout components
│   │   ├── public/              # Public-facing
│   │   └── shared/              # Shared utilities
│   ├── lib/                     # Libraries & utilities
│   │   ├── supabase/            # Supabase clients
│   │   ├── email.ts             # Email service
│   │   └── vietqr.ts            # VietQR integration
│   └── types/                   # TypeScript types
├── public/                      # Static assets
├── .env.local                   # Environment variables
├── next.config.ts               # Next.js config
├── tailwind.config.ts           # Tailwind config
├── schema.sql                   # Database schema
├── data.sql                     # Sample data
├── STORAGE_SETUP.sql            # Storage bucket setup
├── FIX_TRIGGERS_RLS.sql         # Trigger fixes
└── *.md                         # Documentation files
```

### Next.js 16 Features Used

- **App Router**: File-based routing
- **Server Components**: Default for pages
- **Client Components**: `'use client'` for interactivity
- **Server Actions**: `'use server'` for mutations
- **Dynamic Routes**: `[slug]`, `[id]` parameters
- **Route Groups**: `(public)`, `(protected)`
- **Layouts**: Nested layouts with shared UI
- **Loading States**: `loading.tsx` files
- **Error Boundaries**: `error.tsx` files

### Supabase Integration

**Client Types**:
1. **Browser Client** (`src/lib/supabase/client.ts`)
   - Used in Client Components
   - Real-time subscriptions
   - Client-side queries

2. **Server Client** (`src/lib/supabase/server.ts`)
   - Used in Server Components & Actions
   - Cookie-based auth
   - Server-side queries

3. **Middleware** (`src/lib/supabase/middleware.ts`)
   - Session refresh
   - Cookie management
   - Auth state sync

**Features Used**:
- Authentication (OAuth + Email/Password)
- Database (PostgreSQL with RLS)
- Storage (Ticket QR codes)
- Functions (Code generation, points)
- Triggers (Auto-updates)

---

## 5. Database Schema

### Core Tables Summary

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User profiles | points, rank_id |
| `events` | Events | title, slug, dates, location |
| `ticket_types` | Ticket options | price, quantity, sold_count |
| `orders` | Customer orders | order_number, payment_status |
| `tickets` | Individual tickets | ticket_number, qr_code |
| `ranks` | Loyalty ranks | min_points, multiplier |
| `point_transactions` | Points history | points, type, reason |
| `vouchers` | Discount vouchers | code, type, value |
| `roles` | Admin roles | name, permissions |
| `admin_users` | Admin accounts | user_id, role_id |

### Key Relationships

```
auth.users (Supabase)
  ├─→ profiles (1:1)
  │     └─→ ranks (N:1)
  ├─→ admin_users (1:1)
  │     └─→ roles (N:1)
  └─→ orders (1:N)
        ├─→ events (N:1)
        └─→ tickets (1:N)
              └─→ ticket_types (N:1)

profiles
  ├─→ point_transactions (1:N)
  └─→ rank_history (1:N)
```

### Important Triggers

1. **`handle_new_user`**: Creates profile on signup
2. **`set_ticket_number_trigger`**: Generates secure ticket numbers
3. **`trigger_update_profile_points`**: Updates points on transaction
4. **`auto_update_rank_trigger`**: Auto-promotes users
5. **`set_order_number_trigger`**: Generates order numbers

### Security (RLS Policies)

All tables have Row Level Security enabled:

- **Public Access**: Events, categories, ranks (read-only)
- **User Access**: Own orders, tickets, profile, points
- **Admin Access**: Full access for active admins
- **Super Admin**: Role and admin user management

---

## 6. API & Server Actions

### Server Actions Overview

**Total**: 15 server action files

### Public Actions

**Events** (`src/app/(public)/events/actions.ts`):
```typescript
- getPublicEvents(filters, page, limit) → Event[]
- getPublicEventBySlug(slug) → Event
- getRelatedEvents(eventId, categoryId) → Event[]
```

**Profile** (`src/app/(public)/profile/actions.ts`):
```typescript
- getUserPointsSummary() → PointsSummary
- getPointTransactions(limit) → Transaction[]
- getRankHistory() → RankChange[]
```

### Checkout Actions

**Checkout** (`src/app/checkout/actions.ts`):
```typescript
- createOrder(input) → Order
  // Creates order with VietQR, 15-min expiration

- getOrderById(orderId) → Order
  // For payment page display

- confirmOrderPayment(orderId, verification) → Result
  // Admin confirms → Creates tickets → Sends email

- getOrders(filters) → Order[]
  // Admin order listing
```

### Admin Actions

**Events** (`src/app/admin/(protected)/events/actions.ts`):
```typescript
- getEvents(filters) → Event[]
- getEventById(id) → Event
- createEvent(data) → Event
- updateEvent(id, data) → Event
- deleteEvent(id) → void
- publishEvent(id) → Event
```

**Roles** (`src/app/admin/(protected)/roles/actions.ts`):
```typescript
- getRoles() → Role[]
- getRoleById(id) → Role
- createRole(data) → Role
- updateRole(id, data) → Role
- deleteRole(id) → void
- toggleRoleStatus(id) → Role
```

### Data Fetching Pattern

**Server Components** (Preferred):
```typescript
// Direct database access
export default async function EventsPage() {
  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')

  return <EventsList events={events} />
}
```

**Server Actions** (For mutations):
```typescript
'use server'

export async function createEvent(data: EventInput) {
  const supabase = await createClient()
  const { data: event, error } = await supabase
    .from('events')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/admin/events')
  return event
}
```

---

## 7. Missing Features / TODOs

### ❌ Features in Sidebar but Not Implemented

These links exist in `admin-sidebar.tsx` but pages don't exist:

1. **Event Categories Management** (`/admin/events/categories`)
   - Database: ✅ Table exists
   - UI: ❌ Not implemented
   - Need: CRUD operations

2. **Ticket Management** (`/admin/tickets`, `/admin/tickets/scan`)
   - Database: ✅ Table exists
   - UI: ❌ Not implemented
   - Need: Ticket listing, QR scanner

3. **Blog System** (`/admin/blog`)
   - Database: ✅ Tables exist
   - UI: ❌ Not implemented
   - Need: Post CRUD, category management

4. **User Management** (`/admin/users`)
   - Database: ✅ Profiles table exists
   - UI: ❌ Not implemented
   - Need: User listing, editing, blocking

5. **Voucher Management** (`/admin/vouchers`)
   - Database: ✅ Full schema exists
   - UI: ❌ Not implemented
   - Need: CRUD, redemption tracking
   - TODO in checkout: Apply voucher discount

6. **Reports** (`/admin/reports`)
   - Database: ✅ Data available
   - UI: ❌ Not implemented
   - Need: Analytics, charts, exports

7. **Admin Users** (`/admin/admins`)
   - Database: ✅ Table exists
   - UI: ❌ Not implemented
   - Need: Admin listing, creation

8. **Settings** (`/admin/settings`)
   - UI: ❌ Not implemented
   - Need: System configuration

### ❌ Features with Database Structure Only

**Voucher System**:
- Tables: ✅ `vouchers`, `user_vouchers`
- Public UI: ❌ Browse/redeem vouchers
- Admin UI: ❌ Create/manage vouchers
- Checkout: ❌ Apply discount

**Blog System**:
- Tables: ✅ `blog_posts`, `blog_categories`
- Public: ❌ Blog listing, detail pages
- Admin: ❌ Post management

**Check-in System**:
- Table: ✅ `checkin_logs`
- Scanner: ❌ QR code scanner
- Validation: ❌ Check-in logic
- Reports: ❌ Check-in statistics

### ❌ Missing Functionality

1. **Order Cancellation**: No user/admin cancellation flow
2. **Refunds**: Status exists, no workflow
3. **Ticket Transfers**: Can't change ticket holder
4. **Advanced Search**: No full-text search, date/price filters
5. **Notifications**: Email on purchase only
6. **Analytics**: Basic stats, no charts/graphs
7. **Export**: No CSV/PDF exports

### ⚠️ Known Issues

**From FIX_TRIGGERS_RLS.sql**:
- Some triggers need `SECURITY DEFINER` for RLS
- Functions to verify: All code generation functions

**From TODO comments**:
- `checkout/actions.ts:81` - Apply voucher discount
- `checkout-form.tsx:55` - Discount calculation

### 🔒 Security Considerations

1. **Input Validation**: Need comprehensive validation
2. **Rate Limiting**: No rate limiting implemented
3. **CSRF**: Verify all form protections
4. **RLS Audit**: Review all policies
5. **Error Handling**: Need structured error handling

### 📝 Testing & Documentation

1. **No Tests**: Zero test coverage
2. **Limited Docs**: Basic setup guides only
3. **No API Docs**: No OpenAPI/Swagger
4. **No Component Docs**: No Storybook

---

## 8. Setup Instructions

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Cloudinary account
- Resend account

### Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# VietQR Configuration
VIETQR_BANK_ID=970422
VIETQR_ACCOUNT_NO=0965746239
VIETQR_ACCOUNT_NAME="YOUR NAME"

# Resend
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
```

### Database Setup

1. **Run Schema**:
   ```sql
   -- Run schema.sql in Supabase SQL Editor
   ```

2. **Run Trigger Fixes**:
   ```sql
   -- Run FIX_TRIGGERS_RLS.sql
   ```

3. **Setup Storage**:
   ```sql
   -- Run STORAGE_SETUP.sql
   ```

4. **Load Sample Data** (Optional):
   ```sql
   -- Run data.sql
   ```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### First Steps

1. **Create Super Admin**:
   - Manually insert into `admin_users` table
   - Assign super admin role

2. **Configure OAuth**:
   - Add Google OAuth in Supabase Dashboard
   - Add redirect URLs

3. **Test Payment Flow**:
   - Create test event
   - Test checkout
   - Verify VietQR generation
   - Confirm payment as admin

---

## 9. Development Guide

### Adding New Features

1. **Create Route**: Add page in `src/app/`
2. **Create Actions**: Add `actions.ts` with `'use server'`
3. **Create Components**: Add to `src/components/`
4. **Update Database**: Add tables/functions if needed
5. **Update Navigation**: Add to sidebar/header

### Code Conventions

- **Server Components**: Default, no directive needed
- **Client Components**: Add `'use client'` at top
- **Server Actions**: Add `'use server'` at top
- **Naming**: kebab-case for files, PascalCase for components
- **Imports**: Use `@/` alias for absolute imports

### Database Changes

1. Update `schema.sql`
2. Run SQL in Supabase
3. Test with sample data
4. Update TypeScript types

### Component Guidelines

- Keep components small and focused
- Extract reusable logic to hooks
- Use Tailwind for styling
- Follow Shadcn/ui patterns

---

## Project Status

### ✅ Production Ready
- Event management
- Ticket booking
- VietQR payment
- Order management
- Points & ranks
- Email notifications

### ⏳ In Development
- Voucher system UI
- User management
- Ticket scanner
- Reports & analytics

### 📋 Planned
- Blog system
- Advanced search
- Mobile app
- Automated testing

---

## Support & Resources

- **Documentation**: See `*.md` files in root
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **VietQR API**: https://vietqr.io/

---

**Generated**: January 2025
**Project**: Orochi Web v1.0.0
