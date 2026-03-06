# PipaPal - Waste Management Platform

## Overview

PipaPal is a comprehensive waste management platform built for Kenya that connects households, waste collectors, recyclers, and organizations through a modern web application. The platform facilitates waste collection scheduling, recycling coordination, and environmental impact tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

PipaPal follows a full-stack TypeScript architecture with a clear separation between client and server components:

### Frontend Architecture
- **Framework**: React with Vite for fast development and building
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom theming support
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: Firebase Authentication with custom backend integration
- **Real-time Communication**: WebSocket integration for live updates

### Backend Architecture
- **Runtime**: Node.js with TypeScript (ESM modules)
- **Framework**: Express.js for API endpoints
- **Database**: PostgreSQL with Neon Database (serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with local strategy + Firebase integration
- **Session Management**: Express sessions with PostgreSQL store
- **Real-time**: WebSocket server for notifications and live updates

## Key Components

### Database Schema
The application uses a comprehensive PostgreSQL schema with the following core entities:
- **Users**: Multi-role system (household, collector, recycler, organization, admin)
- **Collections**: Waste pickup requests with status tracking, includes `verificationCode` (6-digit code generated when collector starts pickup, customer shares with collector to confirm completion), `dropoffCenterId` (recycler user ID), `dropoffStatus`, `dropoffCode` (unique delivery code), and `dropoffConfirmed` for the full drop-off workflow
- **Waste Acceptance Limits**: Per-waste-type capacity limits set by recyclers (amount + period: daily/weekly/monthly), with `currentUsed` tracking
- **Recycling Centers**: Directory of waste processing facilities (legacy — drop-offs now go to recycler users directly)
- **Material Interests**: Recycler interest in specific waste collections
- **Chat Messages**: Communication system between users
- **Impact Tracking**: Environmental impact metrics and calculations
- **Activities**: User action logging and gamification
- **Feedback**: User feedback and support system
- **User Ratings**: User-to-user rating system (1-5 stars with optional comments, tied to collections, unique constraint on collectionId+raterId+rateeId)

### Pricing Model
- **Shared pricing config** in `shared/schema.ts`: `wastePricingConfig` with per-waste-type rates (customerRate, collectorRate, recyclerRate, pipaPalMargin)
- **Pricing categories**:
  - HIGH_VALUE (metal, electronic, plastic PET): Customer EARNS (wallet credit), negative customerRate
  - BREAK_EVEN (cardboard, paper white, plastic rigid): Free collection, customerRate = 0
  - DISPOSAL_FEE (glass, organic, paper mixed, plastic flexible, general): Customer PAYS (wallet debit)
  - HIGH_COST (hazardous, electronic bulky): Premium disposal fee
- **On collection completion**: customer wallet auto-credited/debited, collector wallet auto-credited with earnings
- Helper functions: `getCustomerCostEstimate()`, `getCollectorEarnings()`, `getRecyclerCost()`
- Pickup form shows pricing estimate per waste type (earn/free/fee)
- Collector page shows "Your earnings" per collection

### Billing & Wallet
- **Virtual Wallet**: Per-user wallet with balance tracking (schema: `wallets` + `wallet_transactions` tables)
  - Top-up via M-Pesa STK Push (sandbox mode auto-credits balance when callback URL is placeholder)
  - Transaction types: topup, payment, refund, earning
  - API: GET `/api/wallet`, GET `/api/wallet/transactions`, POST `/api/wallet/topup`
- **Billing Page** (`/billing`): Wallet card (green gradient, balance display, top-up dialog) + tabbed view: "Wallet Activity" and "Payment History"
  - Wallet Activity: timeline of wallet transactions with type icons (earning uses TrendingUp icon), amounts, running balance
  - Payment History: M-Pesa payment list with date, amount, status badges, phone, receipt
  - Filter by payment status (All, Paid, Pending, Failed, Cancelled)
  - Currency: KSh (Kenyan Shillings) throughout
- Accessible from My Account dropdown and mobile menu in navbar

### User Roles and Permissions
- **Households**: Schedule pickups, track impact, view recycling centers
- **Collectors**: Accept jobs, manage routes, communicate with customers
- **Recyclers**: Browse available materials, express interest, make purchases
- **Organizations**: Bulk waste management, organizational reporting
- **Admins**: Platform management and oversight

### External Integrations
- **Firebase**: Authentication and email verification
- **Anthropic AI**: Eco-tip generation (with fallback content)
- **SendGrid**: Email notifications and communication
- **Leaflet / OpenStreetMap**: Interactive maps and location services (free, no API key required)
- **Neon Database**: Serverless PostgreSQL hosting
- **M-Pesa Daraja API**: Mobile money payments via Safaricom STK Push (sandbox mode)

## Data Flow

1. **User Registration**: Firebase handles initial auth, backend creates user profiles. Consent checkboxes (Privacy Policy, Terms & Conditions, User Agreement) required during signup per Kenya DPA 2019. Consent is recorded with timestamp in the database.
2. **Waste Collection**: Households schedule → Collectors accept → Status updates via WebSocket
3. **Recycling Process**: Collectors complete jobs → Recyclers browse materials → Express interest
4. **Communication**: Real-time chat system between all user types
5. **Impact Tracking**: Automatic calculation of environmental metrics from completed collections

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **firebase**: Authentication services
- **@anthropic-ai/sdk**: AI-powered eco-tip generation
- **react-leaflet**: Interactive maps with OpenStreetMap (free, no API key)
- **@sendgrid/mail**: Email service integration
- **ws**: WebSocket server implementation

### UI Dependencies
- **@radix-ui/react-***: Accessible UI component primitives
- **@tanstack/react-query**: Server state management
- **tailwindcss**: Utility-first CSS framework
- **react-hook-form**: Form handling and validation
- **zod**: Schema validation

## Deployment Strategy

The application is configured for Replit deployment with the following setup:

### Build Process
- **Development**: `npm run dev` - Runs TypeScript server with hot reload
- **Production Build**: `npm run build` - Vite builds frontend, esbuild bundles server
- **Database**: `npm run db:push` - Applies schema changes via Drizzle

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Firebase configuration through Vite environment variables
- Session security via `SESSION_SECRET`
- External API keys for Anthropic, SendGrid, and Google services

### File Structure
- `client/`: React frontend application
- `server/`: Express.js backend API
- `shared/`: Common TypeScript types and schemas
- `migrations/`: Database migration files
- `scripts/`: Database seeding and maintenance scripts

The platform uses a monorepo structure with shared TypeScript definitions, enabling type safety across the full stack while maintaining clear separation of concerns between frontend and backend components.