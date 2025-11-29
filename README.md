# ContentCraft AI

**AI-powered content creation and marketing management platform**

ContentCraft AI is a comprehensive SaaS platform that combines AI-powered content generation, multi-channel publishing, SEO optimization, and marketing automation. Built with Next.js 15, PostgreSQL, and modern web technologies.

## Features

### Phase 1 (Foundation) - Completed
- ✅ User authentication (registration, login, logout)
- ✅ JWT-based session management
- ✅ Multi-tenant architecture with RBAC
- ✅ PostgreSQL database with Prisma ORM
- ✅ Dark/Light theme support
- ✅ Docker Compose infrastructure
- ✅ Professional UI with shadcn/ui components

### Phase 2-5 (Coming Soon)
- 🚧 AI content generation (ChatGPT, Claude)
- 🚧 Multi-channel publishing (Twitter, LinkedIn, Facebook)
- 🚧 SEO keyword research and optimization
- 🚧 AI image generation (DALL-E, Midjourney)
- 🚧 Blog management system
- 🚧 Workflow automation with n8n

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **Docker** and **Docker Compose**
- **Git**
- **npm** or **yarn**

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken + bcrypt)
- **UI Components**: shadcn/ui + Tailwind CSS
- **Theme**: next-themes
- **Forms**: react-hook-form + Zod
- **Docker Services**: PostgreSQL, Redis, n8n, MinIO
- **Testing**: Playwright (E2E)

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd contentcraft-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://postgres:contentcraft123@localhost:5433/contentcraft"

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_ACCESS_SECRET="your-super-secret-access-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"

# Encryption (for API keys)
ENCRYPTION_KEY="your-32-character-encryption-key-change-this!!"

# Optional: External Services (for Phase 2+)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
```

**Important**: Change all secrets in production! Use strong, random strings.

### 4. Start Docker services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL (port 5433)
- Redis (port 6379)
- n8n (port 5678)
- MinIO (port 9000/9001)

Verify services are running:

```bash
docker-compose ps
```

### 5. Set up the database

Run Prisma migrations:

```bash
npx prisma migrate dev
```

(Optional) Seed the database:

```bash
npx prisma db seed
```

(Optional) Open Prisma Studio to view data:

```bash
npx prisma studio
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Management

### Using NocoDB (Optional)

You can connect NocoDB to manage your database visually:

**Connection Details:**
- Host: `host.docker.internal` (if NocoDB is in Docker)
- Port: `5433`
- Database: `contentcraft`
- Username: `postgres`
- Password: `contentcraft123`

### Using Prisma Studio

```bash
npx prisma studio
```

Opens at [http://localhost:5555](http://localhost:5555)

### Reset Database

```bash
npx prisma migrate reset
```

**Warning**: This will delete all data!

## Testing

### Run E2E Tests

```bash
# Headless mode
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

**Test Coverage:**
- User registration flow (4 tests)
- User login flow (7 tests)
- User logout flow (5 tests)
- Dashboard access and features (10 tests)
- Theme toggle functionality (8 tests)

**Total: 34 E2E tests**

## Code Quality

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npx tsc --noEmit
```

### Build for Production

```bash
npm run build
```

## Project Structure

```
contentcraft-ai/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages (login, register)
│   ├── api/               # API routes
│   ├── dashboard/         # Protected dashboard page
│   └── page.tsx           # Landing page
├── components/            # React components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utility libraries
│   ├── auth/              # Authentication utilities
│   ├── db/                # Database client
│   └── utils.ts           # Helper functions
├── prisma/                # Database schema and migrations
│   └── schema.prisma      # Prisma schema (15 models)
├── tests/                 # Test files
│   └── e2e/               # Playwright E2E tests
├── docker-compose.yml     # Docker services configuration
├── playwright.config.ts   # Playwright configuration
└── .env                   # Environment variables (create from .env.example)
```

## Database Schema

The database includes 15 models:

- **User** - User accounts
- **Tenant** - Multi-tenant workspaces
- **TenantMember** - Workspace memberships
- **Session** - User sessions
- **Post** - Social media posts
- **Blog** - Blog management
- **Article** - Blog articles
- **SEOKeyword** - Keyword research
- **SocialAccount** - Connected social accounts
- **PublishSchedule** - Publishing calendar
- **AIPrompt** - AI prompt templates
- **ContentTemplate** - Content templates
- **Workflow** - n8n workflows
- **APIKey** - API key management
- **AuditLog** - Security audit trail

## Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint

# Testing
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:e2e:headed  # Run E2E tests in headed mode
npm run test:e2e:report  # View test report

# Database
npx prisma studio        # Open Prisma Studio
npx prisma migrate dev   # Run migrations
npx prisma generate      # Generate Prisma Client
npx prisma db seed       # Seed database
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_ACCESS_SECRET` | Secret for access tokens | Yes | - |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Yes | - |
| `ENCRYPTION_KEY` | 32-char key for encrypting API keys | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key (Phase 2+) | No | - |
| `ANTHROPIC_API_KEY` | Anthropic API key (Phase 2+) | No | - |

## Docker Services

All services are defined in `docker-compose.yml`:

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5433 | Primary database |
| Redis | 6379 | Caching & sessions |
| n8n | 5678 | Workflow automation |
| MinIO | 9000, 9001 | Object storage |

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with secure secrets
- AES-256-GCM encryption for API keys
- Input validation with Zod
- SQL injection prevention via Prisma
- XSS prevention via React
- Session tracking in database

## Development Roadmap

See [MILESTONES.md](../ashish-framework/projects/contentcraft-ai/MILESTONES.md) for detailed progress.

**Phase 1**: Foundation (✅ 100% Complete)
**Phase 2**: AI Content Generation (🚧 In Progress)
**Phase 3**: Publishing & SEO (⏳ Planned)
**Phase 4**: Advanced Features (⏳ Planned)
**Phase 5**: Enterprise & Scale (⏳ Planned)

## Contributing

This project follows the **ashish-prd-template.md** quality standards:

- Zero ESLint/TypeScript errors
- 90+ quality score
- Comprehensive E2E tests
- Professional UI/UX
- Security best practices

## License

**AGPL-3.0** - This project is licensed under the GNU Affero General Public License v3.0.

This license ensures that if you deploy this software as a SaaS:
- You must make your source code available
- Users must be able to download and run their own instance
- Any modifications must also be open-sourced

See [LICENSE](LICENSE) for full details.

## Support

For issues and feature requests, please create an issue in the GitHub repository.

## Author

**Ashish KD Mathpal**

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Testing with [Playwright](https://playwright.dev)

---

**Status**: Phase 1 Complete ✅ | Ready for Phase 2 Development

Built with ❤️ by Ashish KD Mathpal using the ashish-framework
