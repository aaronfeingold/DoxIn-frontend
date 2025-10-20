# Frontend Setup

Next.js application with Better Auth authentication, admin user management, and real-time invoice processing via WebSocket.

## Documentation

- **[WebSocket Quick Start](./docs/WEBSOCKET_QUICKSTART.md)** - Get started with real-time invoice processing
- **[WebSocket Architecture](./docs/WEBSOCKET_INTEGRATION.md)** - Complete architecture documentation

## Prerequisites

1. **Node.js** (v19+)
2. **pnpm** package manager
3. **PostgreSQL** database (tables managed by Flask API)
4. **Google OAuth credentials**
5. **Resend account** for email delivery
6. **Flask API running** on port 5000

## Environment Variables

Create `.env.local`:

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=your-secure-random-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Resend Email Service
RESEND_API_KEY=re_your-resend-api-key

# Database Configuration
DATABASE_URL=postgresql://case-study:password@localhost:5433/case-study

# Flask API Configuration
# NEXT_PUBLIC_FLASK_API_URL - Client-side access (WebSocket connections)
NEXT_PUBLIC_FLASK_API_URL=http://localhost:5000
# FLASK_API_URL - Server-side access (server actions, API routes)
FLASK_API_URL=http://localhost:5000

# Initial Admin (UI safeguard)
NEXT_PUBLIC_INITIAL_ADMIN_EMAIL=admin@example.com

# Development Settings
NODE_ENV=development
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret to `.env.local`

## Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Get API key from dashboard
3. Add to `.env.local`
4. For production: verify your domain

## Installation

```bash
pnpm install
```

## Quick Reference

### Available Scripts

| Command                 | Description                                 |
| ----------------------- | ------------------------------------------- |
| `pnpm dev`              | Start development server on port 3000       |
| `pnpm build`            | Build for production                        |
| `pnpm start`            | Start production server                     |
| `pnpm run format`       | Format all code with Prettier               |
| `pnpm run format:check` | Check code formatting without modifying     |
| `pnpm run lint`         | Run ESLint                                  |
| `pnpm run lint:fix`     | Run ESLint and auto-fix issues              |
| `pnpm run type-check`   | Run TypeScript type checking                |
| `pnpm run validate`     | Run all checks (format + lint + type)       |
| `pnpm prisma generate`  | Generate Prisma client for TypeScript types |

## Prisma Setup

Prisma is used **only for schema generation** and TypeScript types. Database migrations are handled by Flask/Alembic.

```bash
# Generate Prisma client for type safety
pnpm prisma generate
```

**Note**: When Flask schema changes, manually update `prisma/schema.prisma` to match, then run `pnpm prisma generate`. Automated schema sync scripts are planned for v1.0.0 release once the core MVP is ready for review (currently v0.0.1).

## Running the Application

### Development Server

```bash
pnpm dev
```

Application runs on `http://localhost:3000`

### Production Build

```bash
pnpm build
pnpm start
```

## Development Workflow

### Code Quality & Formatting

This project uses ESLint and Prettier to maintain code quality and consistent formatting.

#### Format Code

```bash
# Format all code files
pnpm run format

# Check if files are properly formatted (without modifying)
pnpm run format:check
```

#### Linting

```bash
# Run ESLint to check for code issues
pnpm run lint

# Run ESLint and automatically fix issues
pnpm run lint:fix
```

#### Type Checking

```bash
# Run TypeScript type checking
pnpm run type-check
```

#### Validate Everything

```bash
# Run all checks: format check + lint + type check
pnpm run validate
```

#### Pre-Build Checklist

Before building for production, run:

```bash
pnpm run format        # Format all code
pnpm run lint:fix      # Fix auto-fixable linting issues
pnpm run type-check    # Ensure no type errors
pnpm run build         # Build for production
```

### Editor Setup

VS Code settings are included in `.vscode/settings.json`:

- Auto-format on save enabled
- ESLint auto-fix on save enabled

Recommended VS Code extensions (see `.vscode/extensions.json`):

- Prettier - Code formatter
- ESLint
- Tailwind CSS IntelliSense
- Prisma

## Authentication

### Pages

- **Login**: `/auth/signin`
  - Gmail-only Google OAuth
  - Magic link sign-in for any email

- **Signup**: `/auth/signup`
  - Requires a valid **access code** created by an admin
  - After validating the code, users can sign up with Gmail (Google OAuth) or a magic link

### Access Codes

- Admins generate codes in the Admin Users page (`/admin/users`) or via API `POST /admin/access-codes` (Flask).
- Codes are validated via frontend proxy route:
  - `POST /api/auth/validate-access-code` → proxies to Flask `POST /api/auth/validate-access-code`
- Invitation emails are sent via `POST /api/send-invitation` (Resend), including the signup link with the code.

### Google OAuth

- Only Gmail accounts are permitted for Google OAuth. Non-Gmail domains should use the magic link flow.

### Magic Link

- Frontend calls `POST /api/auth/signin/magic-link` (Better Auth) with `email` and `callbackURL`.
- On success, users complete authentication via the emailed link.

### Admin Protections

- The initial admin (configured via `NEXT_PUBLIC_INITIAL_ADMIN_EMAIL`) cannot be deactivated or demoted in the UI to ensure at least one admin always remains.

## Testing

### Authentication Test

Visit `/test-auth` to verify:

- Session management
- JWT token generation
- Flask API connectivity

### Admin Dashboard

Navigate to `/admin/users` for:

- User management
- Access code generation
- Email invitations
- Role management

## Features

- **Google OAuth + Magic Links** via Better Auth
- **JWT authentication** for Flask API integration
- **Admin dashboard** for user management
- **Professional email invitations** via Resend
- **Role-based access control**

## Troubleshooting

### "JWT Token Invalid"

- Verify `BETTER_AUTH_SECRET` matches Flask configuration

### "Google OAuth Failed"

- Check OAuth credentials and redirect URI

### "Database Connection Failed"

- Verify `DATABASE_URL` and PostgreSQL is running

### "Resend Email Failed"

- Verify Resend API key
- Check domain verification for production
