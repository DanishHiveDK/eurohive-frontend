# 🇪🇺 Eurohive — EU Freelance Marketplace

GDPR-compliant freelance marketplace connecting top European freelancers with businesses across 27 EU countries. Built with Next.js 14, PostgreSQL, Mollie payments, and deployed on Scaleway (EU-only).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend | Next.js API Routes (REST), Socket.io (WebSocket) |
| Database | PostgreSQL 16 (Prisma ORM) |
| Cache | Redis 7 (sessions, rate limiting, pub/sub) |
| Search | Meilisearch (fuzzy, geo, faceted) |
| Payments | Mollie API v2 (iDEAL, SEPA, Cards, Bancontact) |
| Storage | Scaleway Object Storage (S3-compatible) |
| Auth | NextAuth.js v5 (OAuth, JWT, MFA) |
| Hosting | Scaleway Kapsule (Kubernetes), PAR1 + AMS1 |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm or pnpm

### 1. Clone and install

```bash
git clone https://github.com/your-org/eurohive.git
cd eurohive
npm install
```

### 2. Start local services

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, and Meilisearch locally.

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials. For local dev, the defaults work with Docker Compose:

```
DATABASE_URL="postgresql://eurohive:eurohive_dev@localhost:5432/eurohive?schema=public"
REDIS_URL="redis://localhost:6379"
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="eurohive_search_dev_key"
```

### 4. Set up database

```bash
npx prisma generate    # Generate Prisma Client
npx prisma db push     # Push schema to database
npm run db:seed        # Seed with sample data
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
eurohive/
├── prisma/
│   ├── schema.prisma          # Database schema (13 tables)
│   └── seed.ts                # Seed data
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, register (no navbar)
│   │   ├── (platform)/        # Main app pages (with navbar)
│   │   │   ├── dashboard/     # Client & freelancer dashboards
│   │   │   ├── freelancers/   # Browse & profile pages
│   │   │   ├── projects/      # Browse, detail, post wizard
│   │   │   ├── contracts/     # Contract & milestone management
│   │   │   ├── messages/      # Real-time messaging
│   │   │   └── settings/      # Profile & notification settings
│   │   ├── admin/             # Admin panel (KPI, users, disputes, GDPR)
│   │   ├── api/v1/            # REST API routes
│   │   ├── layout.tsx         # Root layout (fonts, metadata)
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/                # Design system components
│   │   ├── layout/            # Navbar, sidebar, footer
│   │   └── forms/             # Form components
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── utils.ts           # Utility functions
│   │   └── validations.ts     # Zod schemas
│   ├── config/
│   │   └── constants.ts       # Platform constants
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript types
│   └── styles/
│       └── globals.css        # Tailwind + custom styles
├── docker-compose.yml         # Local dev services
├── tailwind.config.ts         # Design tokens
├── next.config.ts             # Next.js config (security headers)
└── package.json
```

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Midnight Navy | `#0B1D3A` | Primary text, headers, dark backgrounds |
| Honey Gold | `#E8A838` | CTAs, accents, highlights |
| Cream | `#FBF8F2` | Page backgrounds |
| DM Serif Display | Serif | Headings, large numbers |
| Plus Jakarta Sans | Sans | Body text, UI elements |

## Key Patterns

- **Server Components** for SEO-critical pages (freelancers, projects)
- **Client Components** for interactive features (search, forms, messaging)
- **Zod validation** on all API inputs
- **Prisma ORM** with PostgreSQL arrays, JSONB, and GIN indexes
- **Route groups** `(auth)` and `(platform)` for layout segmentation
- **Colocation** — pages, API routes, and components near their usage

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |

## Documentation

- [Technical Specification](./docs/eurohive-technical-spec.docx)
- [Project Roadmap](./docs/eurohive-roadmap.docx)
- [Prototypes](./docs/prototypes/) — Interactive React prototypes

## License

Proprietary — All rights reserved.
