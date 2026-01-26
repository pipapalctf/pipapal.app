# pipapal.app
PipaPal is a tech-enabled waste management platform that helps communities schedule waste pickup, access eco-tips, and locate recycling centers while promoting responsible waste management and climate action in Kenya.

# PipaPal - Your Waste Buddy - Waste Management Platform

A comprehensive waste management platform built for Kenya that connects households, waste collectors, recyclers, and organizations through a modern web application. The platform facilitates waste collection scheduling, recycling coordination, and environmental impact tracking.

## Features

### Core Functionality
- **Waste Collection Scheduling** - Households can easily schedule waste pickup requests with flexible timing options
- **Real-time Status Updates** - Live tracking of collection status via WebSocket notifications
- **Environmental Impact Tracking** - Automatic calculation and display of metrics like CO2 reduction, water saved, and trees equivalent
- **AI-Powered Eco-Tips** - Personalized sustainability tips generated using AI
- **Recycling Center Directory** - Browse and locate recycling facilities with Google Maps integration
- **In-App Messaging** - Real-time chat system between all user types

### Multi-Role System
- **Households** - Schedule pickups, track environmental impact, view recycling centers
- **Collectors** - Accept collection jobs, manage routes, communicate with customers
- **Recyclers** - Browse available materials from completed collections, express interest
- **Organizations** - Bulk waste management, organizational reporting
- **Admins** - Platform management and oversight

### Gamification
- **Sustainability Score** - Track your eco-friendly actions
- **Achievement Badges** - Earn badges like Eco Starter, Water Saver, Energy Pro, Recycling Champion
- **Activity Points** - Gain points for positive environmental actions

## Tech Stack

### Frontend
- **React 18** with Vite for fast development and hot reload
- **TypeScript** for type safety
- **Tailwind CSS** with custom theming
- **shadcn/ui** (Radix UI) for accessible component primitives
- **TanStack Query** for server state management
- **Wouter** for lightweight client-side routing
- **Framer Motion** for animations
- **Recharts** for data visualization
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **TypeScript** with ESM modules
- **PostgreSQL** (Neon Database - serverless)
- **Drizzle ORM** for type-safe database operations
- **Passport.js** for authentication
- **WebSocket (ws)** for real-time communication

### External Integrations
- **Firebase** - Authentication and email verification
- **Anthropic AI** - AI-powered eco-tip generation
- **SendGrid** - Email notifications
- **Google Maps API** - Location services and mapping

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon Database account)
- Firebase project for authentication
- API keys for external services (Anthropic, SendGrid, Google Maps)

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=your_postgres_connection_string

# Session
SESSION_SECRET=your_session_secret

# Firebase (Frontend - prefix with VITE_)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# External APIs
ANTHROPIC_API_KEY=your_anthropic_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
```

### Installation

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (Vite frontend + esbuild backend) |
| `npm start` | Run production build |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push database schema changes |

## Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── dashboard/  # Dashboard components
│   │   │   ├── forms/      # Form components
│   │   │   ├── modals/     # Modal dialogs
│   │   │   ├── shared/     # Shared components (navbar, footer)
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Main application entry
│   └── index.html
├── server/                 # Express.js backend
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   ├── auth.ts             # Authentication logic
│   └── vite.ts             # Vite dev server integration
├── shared/                 # Shared TypeScript types
│   └── schema.ts           # Database schema and types
├── migrations/             # Database migration files
├── scripts/                # Database seeding scripts
└── public/                 # Static assets
```

## Database Schema

### Core Entities
- **Users** - Multi-role user accounts with role-specific fields
- **Collections** - Waste pickup requests with status tracking
- **Impacts** - Environmental impact metrics per collection
- **Recycling Centers** - Directory of waste processing facilities
- **Material Interests** - Recycler interest in specific waste materials
- **Chat Messages** - Communication between users
- **Badges** - User achievement tracking
- **Activities** - User action logging
- **Eco Tips** - AI-generated sustainability tips
- **Feedback** - User feedback and support

### Waste Types Supported
- General waste
- Plastic
- Paper
- Cardboard
- Glass
- Metal
- Electronic (e-waste)
- Organic
- Hazardous

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Collections
- `GET /api/collections` - Get user's collections
- `POST /api/collections` - Create new collection
- `PATCH /api/collections/:id` - Update collection status
- `GET /api/available-collections` - Get available jobs (for collectors)

### Impact
- `GET /api/impact` - Get user's environmental impact
- `GET /api/impact/cumulative` - Get cumulative platform impact

### Recycling
- `GET /api/recycling-centers` - Get recycling center directory
- `GET /api/material-interests` - Get material interests
- `POST /api/material-interests` - Express interest in materials

### Communication
- `GET /api/messages/:userId` - Get chat messages
- `POST /api/messages` - Send message

### Eco Tips
- `GET /api/ecotips` - Get eco tips (AI-generated or fallback)

## Real-time Features

The application uses WebSocket connections for:
- Collection status updates
- New collection notifications (for collectors)
- Chat message notifications
- General system notifications

## Deployment

The application is configured for deployment on Replit:

1. **Development**: `npm run dev` runs the TypeScript server with hot reload
2. **Production Build**: `npm run build` creates optimized bundles
3. **Database**: Apply schema with `npm run db:push`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For questions, feedback, or support, use the in-app feedback system or contact the development team.

---

Built with care for a cleaner, greener Kenya.
