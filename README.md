# KicksLab

KicksLab is a modern, full-stack luxury footwear e-commerce platform built with Next.js App Router, TypeScript, Tailwind CSS, Prisma ORM, and PostgreSQL. It delivers a high-performance shopping experience for sneaker enthusiasts and a robust back-office management system for store administrators and staff.

---

## Project Overview

KicksLab provides an end-to-end digital retail solution tailored for the Ethiopian market and international footwear retail. It combines high-end visual merchandising, real-time inventory tracking, and seamless checkout workflows with local and digital payment integrations.

- **Customer Storefront**: Fast product exploration, responsive image galleries, size selection, dynamic cart drawer, persistent wishlists, verified customer reviews, automated coupon application, and order tracking.
- **Payment Architecture**: Decoupled payment layer supporting local Cash on Delivery (COD) alongside automated digital mobile money gateways (Telebirr, CBE Birr, and E-Birr) via Chapa.
- **Order & Fulfillment Lifecycle**: Comprehensive order status workflows with automatic inventory adjustments, shipping fee snapshots, and automated customer transactional emails.
- **Store Administration**: Role-protected portal for inventory management, multi-zone shipping configuration, promotional drop scheduling, discount coupons, customer analytics, review moderation, and dual-channel refund processing.

---

## Target Users & Roles

The platform enforces strict server-side role-based access control (`Role` enum in Prisma):

| Role | Target User | Responsibilities & Access |
|---|---|---|
| **`USER`** | Store Customer | Browses catalog, manages cart/wishlist, places orders, makes payments, tracks orders, manages saved delivery addresses, submits verified reviews, requests refunds, updates profile and security settings. |
| **`ADMIN`** | Store Owner / Superadmin | Unrestricted access to `/admin`: manages catalog, sets pricing/discounts, creates coupons, configures shipping zones, approves/processes refunds, manages customer accounts, configures staff, views sales analytics, and adjusts store settings. |
| **`STAFF`** | Fulfillment / Support Staff | Authenticates via `/admin/login` with operational access to view orders, update fulfillment statuses (`PROCESSING`, `PACKED`, `SHIPPED`, `DELIVERED`), inspect stock levels, and review refund/customer inquiries. |

---

## What Users Can Do

### Storefront & Shopping
- **Catalog Browsing & Search**: Explore shoes by categories, gender (Men, Women, Unisex), price range, and size with instant client-side filtering and sorting.
- **Merchandising Collections**: Direct access to curated collections including *Featured*, *Top Selling*, *On Sale*, and *New Arrivals*.
- **Limited Drops**: View active countdown sales and flash drops on `/shop/limited-drop` with time-sensitive promotional pricing.
- **Product Details**: Multi-angle image viewing, size availability indicators, real-time stock counters, stock status badges, and expandable specifications.
- **Customer Reviews**: Read approved, verified-purchase product ratings and reviews with privacy-safe reviewer names (e.g., "John D.").
- **Shopping Cart**: Real-time quantity adjustment, size switching, price subtotaling, shipping calculation preview, and drawer overlay.
- **Wishlist**: Save favorite sneakers with local persistence to review or transfer to the cart at any time.

### Checkout & Payments
- **Multi-Step Checkout**: Streamlined 3-step checkout (Shipping Details $\rightarrow$ Review & Payment $\rightarrow$ Confirmation).
- **Address Selection**: Choose from saved account addresses or enter new shipping coordinates.
- **Shipping Zones**: Dynamic shipping cost calculation based on destination (e.g., Addis Ababa, Dire Dawa, Regional Delivery) with free shipping threshold support.
- **Coupon Redemption**: Validate and apply active percentage or fixed-amount promotional coupons with real-time subtotal deduction.
- **Payment Flexibility**:
  - **Cash on Delivery (Pay at Doorstep)**: Instant order placement without external redirection.
  - **Digital Gateways (Telebirr, CBE Birr, E-Birr)**: Seamless, secure external redirect to Chapa's hosted payment gateway with automatic verification and callback handling.

### Customer Account & Order Management
- **Account Dashboard**: Dedicated dashboard displaying recent purchases, total orders, and unique customer Member ID.
- **Order Invoices & Tracking**: Detailed order receipts, fulfillment progress bar, tracking numbers, and cancellation requests for pending orders.
- **Public Order Tracking**: Track any order on `/track-order` using order number and email address without requiring login.
- **Refund Requests**: Submit refund requests directly from order details with custom refund reasons, problem descriptions, and payout destinations for cash orders.
- **Saved Address Book**: Store multiple delivery addresses with custom labels (Home, Office, Other) and set default addresses.
- **Security**: Self-service password changes from `/account/security` and secure password recovery via email tokens.

---

## Key Features

- **Decoupled Payment Infrastructure**: Transparent separation between customer payment methods (`CASH`, `TELEBIRR`, `CBE_BIRR`, `EBIRR`) and gateway providers (`NONE`, `CHAPA`).
- **Smooth External Redirects**: Full-screen transitional overlay preventing page or footer flashing when navigating to external payment providers.
- **Authoritative Review-Derived Ratings**: Product rating averages are calculated strictly from administrator-approved reviews rather than arbitrary database defaults.
- **Independent Merchandising Flags**: Products independently support `featured`, `topSelling`, `onSale`, and `isNew` flags, allowing flexible multi-section placement.
- **Dual-Channel Refund Processing**: Automated API-driven refunds for Chapa digital payments alongside structured manual payout workflows for Cash on Delivery.
- **Snapshotted Order Data**: Preserves historical integrity by snapshotting product prices, names, images, sizes, and shipping fees onto the order at checkout time.
- **Black Friday & Promotional Engine**: Top-level announcement banner with an interactive one-click "Claim Offer" button that applies discounts to the cart and copies promo codes to the clipboard.
- **Automated Transactional Emails**: 10 distinct, responsive HTML email templates powered by Gmail SMTP via Nodemailer with delivery tracking and idempotency checks.
- **Cloudinary Media Pipeline**: Direct administrative product image uploads with automatic sizing, quality optimization, and secure CDN delivery.

---

## Tech Stack

| Technology | Layer | Purpose |
|---|---|---|
| **Next.js 16 (App Router)** | Full-Stack Framework | Server Components, Client Components, dynamic routing, and API Route Handlers. |
| **React 19** | UI Library | Component-driven user interface and modern hooks. |
| **TypeScript 5** | Language | End-to-end type safety across API routes, database models, and UI components. |
| **Tailwind CSS 4** | Styling | Responsive dark luxury aesthetic, typography, and layout utilities. |
| **Prisma ORM 7** | Database Access | Type-safe query building, migrations, and relational modeling with `@prisma/adapter-pg`. |
| **PostgreSQL / Neon** | Relational Database | Cloud-hosted relational database for products, users, orders, coupons, and reviews. |
| **Auth.js / NextAuth v5 & Jose** | Authentication | JWT-based session tokens with HTTP-only cookies (`kl_customer_session`, `kl_admin_session`). |
| **Chapa API** | Payment Gateway | Payment initialization, hosted checkout redirect, and webhook/callback verification. |
| **Nodemailer** | Email Delivery | Transactional email dispatch over secure Gmail SMTP (port 465). |
| **Cloudinary** | Asset Management | Cloud storage, optimization, and delivery of product photography. |
| **Zustand 5** | State Management | Client-side reactive stores with `localStorage` persistence for shopping cart and wishlist. |
| **Framer Motion 12** | Animations | Smooth page transitions, sliding drawers, and animated notification banners. |
| **Recharts 3** | Analytics | Administrative visual sales, revenue, and order distribution charts. |
| **Lucide React** | Iconography | High-contrast modern interface icons. |
| **Vercel** | Hosting & CI/CD | Serverless deployment platform and edge routing. |

---

## System Architecture

```
                                    ┌────────────────────────┐
                                    │    Client / Browser    │
                                    └───────────┬────────────┘
                                                │
                          HTTPS Requests / Middleware (proxy.ts)
                                                │
                                    ┌───────────▼────────────┐
                                    │   Next.js App Router   │
                                    └─────┬────────────┬─────┘
                                          │            │
                         Server Components│            │Route Handlers (/app/api/*)
                                          │            │
                                    ┌─────▼────────────▼─────┐
                                    │      Service Layer     │
                                    │ (lib/payment, email,   │
                                    │  chapa, reviews, store)│
                                    └─────┬────────────┬─────┘
                                          │            │
                 ┌────────────────────────┼────────────┼────────────────────────┐
                 │                        │            │                        │
        ┌────────▼────────┐      ┌────────▼───────┐  ┌─▼─────────────┐   ┌──────▼──────┐
        │   Prisma ORM    │      │  Chapa Gateway │  │ Gmail SMTP    │   │  Cloudinary │
        │ (@prisma/client)│      │ (Hosted Pay)   │  │ (Nodemailer)  │   │  (CDN)      │
        └────────┬────────┘      └────────────────┘  └───────────────┘   └─────────────┘
                 │
        ┌────────▼────────┐
        │   PostgreSQL    │
        │  (Neon Cloud)   │
        └─────────────────┘
```

- **Routing & Middleware**: Request routing is managed by Next.js App Router with server-level session authentication guarded in `proxy.ts`.
- **Data Layer**: Centralized Prisma client in `lib/prisma.ts` utilizes a connection pool adapter (`@prisma/adapter-pg`) connected to PostgreSQL.
- **Session Layer**: Independent cookie stores isolate administrative sessions (`kl_admin_session`) from customer storefront sessions (`kl_customer_session`), signed via `jose` HS256 JWTs.

---

## Customer Features

### 1. Shopping & Merchandising
- **Home Showcase**: Hero slider with brand story, spotlighted category grids (Lifestyle, Running, Basketball, Casual), and dynamic sections for Top Selling, Featured, and New Arrival footwear.
- **Product Detail View**: High-resolution image preview, colorway/variant selection, shoe size picker, in-stock counters, and direct size availability warnings.
- **Sale & Drop Pricing**: Visual strike-through pricing for sale products (`price` vs. `originalPrice`) and active countdown banners for limited drops.

### 2. Shopping Bag & Wishlist
- **Cart Drawer & Page**: Slide-out drawer accessible from any page alongside a dedicated `/cart` view. Features item quantity adjustments, item removal, subtotal recalculations, and coupon validation.
- **Persistent Wishlist**: One-click heart toggle on product cards. State persists across page reloads and browser sessions.

### 3. Checkout Experience
- **Step 1: Shipping**: Customer contacts, delivery location, and saved address selection.
- **Step 2: Review & Payment**: Order summary, shipping zone cost selection, coupon verification, and payment method choice.
- **Step 3: Confirmation**: Branded order receipt display with order number (`KL-XXXXXX`), transaction reference, payment status badge, and email dispatch confirmation.

### 4. Account Portal (`/account/*`)
- `/account/dashboard`: Summary of total orders, customer membership tier/ID, and quick links.
- `/account/orders`: Historical list of orders with filterable statuses and access to individual order invoices (`/account/orders/[orderNumber]`).
- `/account/addresses`: Management of multiple shipping addresses (add, edit, delete, set default).
- `/account/reviews`: History of customer-authored reviews and their moderation status.
- `/account/security`: Password change form requiring current password verification.

---

## Admin Features

The administrative portal (`/admin`) provides full back-office control:

- **Dashboard (`/admin`)**: Real-time sales statistics, total revenue in ETB, order volume, pending refund count, low stock warnings, and recent transaction feeds.
- **Orders (`/admin/orders`)**: Complete order list with status filters (`PENDING`, `PROCESSING`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`). Admins can inspect customer details, view ordered items, and execute status transitions.
- **Products (`/admin/products`)**: Add, edit, and delete footwear items. Control names, slugs, category assignments, gender tags, sizing arrays, price/sale price, stock quantities, and merchandising flags (`featured`, `topSelling`, `onSale`, `isNew`). Includes direct Cloudinary image upload.
- **Categories (`/admin/categories`)**: Manage footwear categories and taxonomy.
- **Coupons (`/admin/coupons`)**: Create promo codes with percentage or fixed discounts, minimum order requirements, expiration dates, global usage limits, and per-customer usage limits.
- **Promotions (`/admin/promotions`)**: Configure the sitewide promotional announcement banner (banner text, discount rate, promo code, link, active/inactive toggle) and schedule Limited Drops with start/end timestamps.
- **Shipping Settings (`/admin/shipping`)**: Define and adjust regional shipping zones (e.g., Addis Ababa, Dire Dawa, Regional Delivery), delivery fees, and the free shipping threshold amount.
- **Sales Reports (`/admin/reports`)**: Visual revenue analytics, order trend graphs, payment method distribution charts, and exportable sales metrics.
- **Refunds (`/admin/refunds`)**: Review pending refund claims, inspect order history and payment provider, approve or reject with customer-facing notes, trigger automated Chapa API refunds, or finalize manual Cash on Delivery payouts.
- **Reviews (`/admin/reviews`)**: Moderate submitted customer product reviews (approve for public display, hide, or mark as featured testimonial).
- **Settings (`/admin/settings`)**: Update administrative profile details and store contact information.

---

## Staff Features

KicksLab includes native support for the `STAFF` role (`Role.STAFF` in Prisma):

- **Staff Authentication**: Staff members authenticate via `/admin/login` using their assigned credentials.
- **Operational Fulfillment**: Staff accounts can access `/admin/orders` to process orders, verify items, and advance fulfillment statuses (`PROCESSING` $\rightarrow$ `PACKED` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED`).
- **Inventory Inspection**: Staff can monitor stock levels across footwear sizes to alert the procurement team when items are running low.
- **Support & Inquiries**: Staff can inspect customer order details and track delivery locations to respond to customer support inquiries.
- **Security Boundary**: Sensitive store-wide settings and financial configurations are restricted to full `ADMIN` accounts.

---

## Authentication & Authorization

KicksLab implements a dual-layer authentication architecture:

1. **Customer Authentication**:
   - Registration endpoint: `/api/auth/register` (hashes passwords with `bcryptjs` using 10 salt rounds and generates unique Member IDs like `KL-M-XXXXXX`).
   - Customer login endpoint: `/api/auth/login` verifies credentials and issues a signed HS256 JWT stored in the secure HTTP-only cookie `kl_customer_session`.
   - Protected customer routes under `/account/*` are enforced server-side in `proxy.ts`.

2. **Admin & Staff Authentication**:
   - Admin login endpoint: `/api/admin/auth/login` verifies credentials against the database, ensuring the user possesses the `ADMIN` or `STAFF` role.
   - Issues a signed HS256 JWT stored in the secure HTTP-only cookie `kl_admin_session`.
   - Protected routes under `/admin/*` (excluding `/admin/login`, `/admin/forgot-password`, and `/admin/reset-password`) are strictly guarded in `proxy.ts` and individual API route handlers.

3. **Password Recovery**:
   - Supports self-service password resets for both customers and administrators via `/forgot-password` and `/admin/forgot-password`.
   - Generates cryptographically secure reset tokens stored in the `PasswordResetToken` table with 1-hour expiration.
   - Sends branded reset links via email.

---

## Product & Inventory Management

- **Database Model**: Defined in the `Product` Prisma model.
  - Core fields: `name`, `slug`, `description`, `price`, `originalPrice`, `category`, `gender`, `sizes`, `images`, `stock`, `inStock`.
  - Merchandising flags: `featured`, `topSelling`, `onSale`, `isNew`. These flags operate independently; a product can concurrently appear in multiple merchandising sections.
- **Stock Management**:
  - `stock`: Integer field representing physical units on hand.
  - `inStock`: Boolean flag automatically or manually managed. Adding items to cart checks available stock; placing orders decrements inventory.
- **Customer Ratings**:
  - `Product.rating` stores a cached floating-point value.
  - **Authoritative Source**: The public rating is derived strictly from administrator-approved reviews in the `Review` table via `recalculateProductRating()` in `lib/reviews.ts`. If no approved reviews exist, the displayed rating is 0.

---

## Coupons & Promotions

- **Coupon Engine (`Coupon` & `CouponUsage` models)**:
  - Supports `percentage` (e.g., 20% off) or `fixed` (e.g., 500 ETB off) discounts.
  - Enforces minimum order subtotal requirements (`minOrder`).
  - Supports expiration dates (`expiry`) and active state toggles (`active`).
  - Limits usage globally (`usageLimit`) and on a per-customer basis (`perCustomerLimit`).
  - Server-side validation via `/api/coupons/validate` and idempotent usage recording during checkout.
- **Promotional Announcement Banner (`Promotion` model)**:
  - Singleton database model managing the site-wide top banner.
  - Customer can click "Claim Offer" to instantly copy the code and apply it to their shopping bag.
- **Limited Drops (`LimitedDrop` & `LimitedDropProduct` models)**:
  - Time-bound flash drops linking specific products with customized promotional pricing.

---

## Order Lifecycle

Orders follow a structured state machine with strict database enum enforcement:

### Order Statuses (`OrderStatus`)
- `PENDING`: Order has been placed; awaiting payment confirmation or cash delivery.
- `PROCESSING`: Payment confirmed (or COD order verified); order sent to warehouse for fulfillment.
- `PACKED`: Items picked, checked, and packaged for courier dispatch.
- `SHIPPED`: Consigned to local delivery couriers with tracking reference.
- `DELIVERED`: Successfully delivered to customer doorstep.
- `CANCELLED`: Cancelled by customer (if pending) or store administrator.
- `REFUNDED`: Order has been fully refunded through Chapa or COD payout.

### Payment Statuses (`PaymentStatus`)
- `PENDING`: Awaiting payment confirmation.
- `PAID`: Successfully charged and verified via Chapa or confirmed by delivery courier.
- `FAILED`: Gateway transaction declined or unparseable response.
- `CANCELLED`: Payment cancelled before completion.

---

## Payments Architecture

KicksLab separates the customer-facing payment choice from the underlying processing gateway:

```
Customer Payment Method               Processing Provider
───────────────────────               ───────────────────
Cash                      ───────►    NONE (COD Workflow)
Telebirr                  ───────►    CHAPA (Hosted Checkout)
CBE Birr                  ───────►    CHAPA (Hosted Checkout)
E-Birr                    ───────►    CHAPA (Hosted Checkout)
```

### Cash Workflow
1. Customer selects **Cash** at checkout.
2. Order is created directly in the database with `paymentMethod = "CASH"`, `paymentProvider = "NONE"`, and `paymentStatus = "PENDING"`.
3. Shopping cart is cleared, and customer is immediately directed to the confirmation view.
4. Payment is collected in cash upon doorstep delivery.

### Chapa Digital Workflow (Telebirr, CBE Birr, E-Birr)
1. Customer selects their preferred mobile wallet or bank option.
2. Checkout initiates payment via `POST /api/payments/chapa/initialize`.
3. Server generates a unique transaction reference (`tx_ref`), snapshots order items, and registers the transaction with the Chapa API.
4. Chapa returns a hosted checkout URL (`https://checkout.chapa.co/checkout/payment/...`).
5. Client displays a full-screen transition overlay and navigates the browser directly to the external Chapa URL.
6. Customer completes payment on Chapa.
7. Chapa redirects back to `GET /api/payments/chapa/verify?tx_ref=...` (and triggers webhook `POST /api/webhooks/chapa`).
8. Verification route verifies transaction status with Chapa server-side, marks the order as `PAID`, dispatches the confirmation email, and redirects to `/checkout?step=3`.

---

## Shipping System

- **Shipping Zones (`ShippingZone` model)**:
  - Administrators configure active regional delivery zones (e.g., *Addis Ababa*, *Dire Dawa*, *Regional Delivery*) with localized delivery fees in Ethiopian Birr (ETB).
- **Free Shipping Threshold (`ShippingSettings` model)**:
  - Global toggle and threshold amount (e.g., free delivery on orders over 5,000 ETB).
- **Historical Fee Snapshotting**:
  - When an order is created, `shippingZone` and `shippingCost` are saved as permanent snapshots on the `Order` record, ensuring historical order accounting remains unchanged if shipping rates are later adjusted.

---

## Product Reviews

- **Verified Purchase Requirement**: Reviews are linked to both a `userId` and an optional `orderId`. Review submission requires verification that the customer purchased and received the product (`OrderStatus.DELIVERED`).
- **Moderation Workflow**:
  - Newly submitted reviews default to `ReviewStatus.PENDING`.
  - Administrators review submissions in `/admin/reviews` to approve (`APPROVED`) or hide (`HIDDEN`) them.
  - Admins can designate top reviews as `isFeatured = true` for homepage testimonials.
- **Privacy Display**:
  - Reviewer names are formatted via `formatReviewerName()` to protect customer privacy (e.g., "Abebe Kebede" $\rightarrow$ "Abebe K.").

---

## Email System

Automated email communication is powered by **Nodemailer** over secure Gmail SMTP (port 465) in `lib/email.ts`. All templates use custom responsive HTML matching KicksLab's dark-luxury visual identity.

### Implemented Transactional Emails:
1. **Welcome Email**: Sent upon customer registration with account details and Member ID (`sendWelcomeEmail`).
2. **Order Confirmation**: Sent upon verified payment or cash order placement with item breakdown, pricing, shipping address, and tracking link (`sendOrderConfirmationEmail`).
3. **Order Delivered**: Sent when an order is marked as delivered, inviting the customer to submit a verified review (`sendOrderDeliveredEmail`).
4. **Order Cancelled**: Notification detailing order cancellation and refund instructions if applicable (`sendOrderCancelledEmail`).
5. **Customer Password Reset**: Secure password recovery token link (`sendCustomerPasswordResetEmail`).
6. **Admin Password Reset**: Administrative portal recovery link (`sendAdminPasswordResetEmail`).
7. **Refund Approved**: Notification that admin approved a refund request and processing has begun (`sendRefundApprovedEmail`).
8. **Refund Successful**: Confirmation that funds were credited back via Chapa or manual COD transfer (`sendRefundSuccessEmail`).
9. **Refund Failed**: Alert regarding payment gateway refund processing issues (`sendRefundFailedEmail`).
10. **Refund Rejected**: Notification detailing why a refund request could not be approved (`sendRefundRejectedEmail`).

---

## Refunds Workflow

KicksLab provides a two-track refund handling process based on the original payment provider:

```
                                Customer Requests Refund
                                (/track-order or /account)
                                           │
                                           ▼
                                 Admin Review (/admin)
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
           Chapa Digital Order                           Cash on Delivery (COD)
                    │                                             │
      Admin clicks "Approve & Refund"               Customer provides bank/telecom
                    │                               details (Telebirr, CBE, E-Birr)
     KicksLab calls Chapa Refund API                              │
                    │                               Admin completes transfer manually
     Chapa processes electronic return                            │
                    │                               Admin clicks "Complete COD Refund"
                    └──────────────────────┬──────────────────────┘
                                           │
                                           ▼
                              Status set to REFUNDED
                        Automated Email Notification Sent
```

- **Chapa Refunds**: Initiated via server-side call to Chapa's refund API using original `tx_ref` and `chapaRefId`. Status transitions from `PENDING` $\rightarrow$ `PROCESSING` $\rightarrow$ `REFUNDED`.
- **Cash on Delivery Refunds**: Customer specifies their payout destination (`refundMethod`: Telebirr, CBE, E-Birr, Awash Birr, along with account name and number). The administrator manually issues the transfer and records the transaction in the portal (`/api/admin/refunds/[id]/complete-cod`).

---

## Image Storage

- **Provider**: **Cloudinary** (configured via official SDK in `app/api/upload/route.ts`).
- **Product Photography**: Product images uploaded in the administrative portal are stored in the `kickslab/products` Cloudinary folder with automatic resizing (`800x800` max), aspect ratio preservation, and automatic WebP/AVIF quality optimization.
- **Avatars**: The application deliberately uses generic user initials and icons for customer and staff accounts; personal avatar uploads are not required.

---

## Database Configuration

- **Database Engine**: PostgreSQL (Neon Serverless PostgreSQL or local PostgreSQL instance).
- **ORM**: Prisma ORM with `@prisma/client` and `@prisma/adapter-pg`.
- **Primary Configuration**: `prisma/schema.prisma` and `prisma.config.ts`.
- **Seeding**: Comprehensive development seed data configured in `prisma/seed.ts`.

---

## Environment Variables

Configure the following variables in `.env` (or `.env.local` for development). Refer to `.env.example` for a template:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection URI (e.g., `postgresql://user:password@host:5432/kickslab?sslmode=require`). |
| `AUTH_SECRET` | **Yes** | 32+ character random string used to sign JWT sessions and security tokens. |
| `NEXTAUTH_URL` | **Yes** | Canonical application base URL (e.g., `http://localhost:3000` or `https://your-domain.com`). |
| `CHAPA_SECRET_KEY` | **Yes** | Chapa API secret key (`CHASECK_TEST-...` for test sandbox, `CHASECK_LIVE-...` for production). |
| `EMAIL_USER` | **Yes** | Gmail SMTP sending email address (e.g., `store@gmail.com`). |
| `EMAIL_PASS` | **Yes** | Gmail 16-character App Password (generated in Google Account Security). |
| `ADMIN_EMAIL` | No | Default store administrator email used for initial database seeding. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name for administrative image uploads. |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key for server-side upload authentication. |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret for secure asset management. |
| `NODE_ENV` | No | Runtime environment (`development` or `production`). |

---

## Getting Started

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL database instance (local or Neon cloud)
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/kickslab.git
   cd kickslab
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your database credentials, secret keys, and SMTP credentials.

4. **Initialize the database**:
   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev --name init

   # (Optional) Seed the database with sample shoes, categories, and promo data
   npx prisma db seed
   ```

5. **Start the local development server**:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to view the customer storefront.
7. Access the administrative portal at [http://localhost:3000/admin](http://localhost:3000/admin).

---

## Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts the Next.js development server with Turbopack on port 3000. |
| `npm run build` | Compiles an optimized production build of the entire application. |
| `npm run start` | Boots the compiled production server. |
| `npm run lint` | Executes ESLint across all codebase files. |
| `npx prisma studio` | Opens visual Prisma database browser on port 5555. |
| `npx prisma db seed` | Executes the database seed script in `prisma/seed.ts`. |

---

## Deployment

KicksLab is designed for zero-configuration serverless deployment on **Vercel**:

1. Push your code to a GitHub, GitLab, or Bitbucket repository.
2. Import the project into the [Vercel Dashboard](https://vercel.com).
3. Under **Environment Variables**, configure all production variables (`DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `CHAPA_SECRET_KEY`, `EMAIL_USER`, `EMAIL_PASS`, Cloudinary credentials).
4. Set `NEXTAUTH_URL` to your production domain (e.g., `https://kickslab.vercel.app`).
5. Ensure your production PostgreSQL instance (e.g. Neon) permits connections from Vercel's IP pool (`sslmode=require`).
6. Deploy. Vercel automatically runs `prisma generate` during `postinstall` and compiles the production bundle via `npm run build`.

---

## License

This project is proprietary and maintained for KicksLab. All rights reserved.
