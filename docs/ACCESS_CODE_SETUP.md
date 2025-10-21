# Access Code System - Quick Setup Guide

## Prerequisites

- Node.js 18+ and pnpm installed
- PostgreSQL database running
- Redis container running (your existing setup)
- Cloudflare account (for Turnstile CAPTCHA)
- Resend account (for emails)

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

New packages added:
- `ioredis` - Redis client for your container
- `rate-limiter-flexible` - Rate limiting with Redis
- `@marsidev/react-turnstile` - Cloudflare CAPTCHA

### 2. Environment Variables

Copy and update your `.env` file:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5433/doxin"

# Redis (your existing container)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # if your container has a password

# Better Auth
BETTER_AUTH_SECRET="generate-a-secure-random-string"
BETTER_AUTH_URL="http://localhost:3000"

# Cloudflare Turnstile CAPTCHA
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your-site-key-from-cloudflare"
TURNSTILE_SECRET_KEY="your-secret-key-from-cloudflare"

# Resend Email
RESEND_API_KEY="re_xxxxx"

# App
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NODE_ENV=development
```

### 3. Get Cloudflare Turnstile Keys

1. Go to https://dash.cloudflare.com/
2. Select your account → Turnstile
3. Click "Add Site"
4. Enter your domain (for dev: `localhost`)
5. Select "Managed" mode
6. Copy the **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
7. Copy the **Secret Key** → `TURNSTILE_SECRET_KEY`

### 4. Get Resend API Key

1. Go to https://resend.com/
2. Sign up/Login
3. Go to API Keys
4. Create new API key
5. Copy key → `RESEND_API_KEY`

**Note**: For production, verify your domain in Resend dashboard.

### 5. Run Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_access_request_system

# Or if database is already in sync
npx prisma db push
```

This creates:
- `AccessRequest` table for user access requests
- Updates `AccessCode` table with new fields

### 6. Start Development Server

```bash
pnpm dev
```

### 7. Test Redis Connection

The app will automatically try to connect to Redis on startup. Check logs for:
```
✅ Redis connected successfully
```

If you see connection errors, verify:
- Redis container is running: `docker ps | grep redis`
- Port 6379 is accessible
- REDIS_HOST and REDIS_PORT are correct

### 8. Create Your First Admin User

You'll need an admin user to approve access requests.

**Option A: Manually in Database**
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

**Option B: Sign up normally, then update via Prisma Studio**
```bash
npx prisma studio
```
Navigate to users table → Find your user → Change role to "admin"

## Testing the Flow

### Test User Access Request Flow

1. **Visit Request Access Page**
   ```
   http://localhost:3000/auth/request-access
   ```

2. **Fill Form & Submit**
   - Enter name and email
   - Complete CAPTCHA
   - Submit request
   - Should see success message

3. **View Request as Admin**
   ```
   http://localhost:3000/admin/access-requests
   ```
   (You'll need to build this page - currently pending)

4. **Approve Request (via API for now)**
   ```bash
   # Get request ID from database
   # Approve it
   curl -X POST http://localhost:3000/api/admin/access-requests/[REQUEST_ID]/approve \
     -H "Cookie: your-session-cookie"
   ```

5. **Send Invitation**
   ```bash
   curl -X POST http://localhost:3000/api/admin/access-requests/batch-send-invitations \
     -H "Content-Type: application/json" \
     -H "Cookie: your-session-cookie" \
     -d '{"requestIds": ["REQUEST_ID"]}'
   ```

6. **Sign Up with Code**
   - Check email for invitation
   - Click link or copy access code
   - Visit signup page
   - Enter code (should auto-validate with green checkmark)
   - Complete signup

### Test Admin Direct Invitation Flow

1. **Generate Access Code**
   ```
   http://localhost:3000/admin/users
   ```
   Click "Generate Access Code" button (already exists)

2. **Share Code**
   - Copy the code from modal
   - OR use "Send Invitation" button

3. **Sign Up with Code**
   - User visits signup page
   - Enters code
   - Completes registration

## Architecture Overview

```
User Flow:
┌─────────────────┐
│ Request Access  │ → CAPTCHA → Rate Limit → Create Request
└─────────────────┘

Admin Workflow:
┌─────────────────┐
│ Review Requests │ → Approve → Batch Send → Generate Codes → Email
└─────────────────┘

Signup Flow:
┌─────────────────┐
│ Enter Code      │ → Validate → Real-time Check → Create Account
└─────────────────┘

Session Management:
┌─────────────────┐          ┌──────────┐          ┌────────────┐
│  Next.js App    │ ←──────→ │  Redis   │ ←──────→ │ PostgreSQL │
│  (Stateless)    │          │ Sessions │          │ User Data  │
└─────────────────┘          └──────────┘          └────────────┘
```

## API Endpoints Reference

### Public Endpoints

- `POST /api/auth/request-access` - Submit access request
- `GET /api/auth/request-access?email=xxx` - Check request status
- `GET /api/auth/validate-access-code?code=xxx` - Validate code
- `POST /api/auth/use-access-code` - Mark code as used
- `POST /api/auth/signup` - Create account (via Better Auth)

### Admin-Only Endpoints

- `GET /api/admin/access-requests` - List requests (paginated)
- `POST /api/admin/access-requests/[id]/approve` - Approve request
- `POST /api/admin/access-requests/[id]/reject` - Reject request
- `POST /api/admin/access-requests/batch-approve` - Bulk approve
- `POST /api/admin/access-requests/batch-send-invitations` - Send codes
- `POST /api/auth/generate-access-code` - Generate code directly

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Request Access | 3 requests | 24 hours per email |
| Validate Code | 5 attempts | 15 minutes per IP |
| Generate Code | 50 codes | 24 hours per admin |
| Magic Link | 3 requests | 15 minutes per email |

## Troubleshooting

### "CAPTCHA token is required"
- Check `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set
- Verify site key matches your domain
- Clear browser cache

### "Too many requests"
- Rate limit hit - wait for window to reset
- Check Redis for rate limit keys: `rl:*`
- Manually clear in Redis if needed

### "Failed to validate access code"
- Code may be expired (24-hour lifetime)
- Code may already be used
- Check database: `SELECT * FROM access_codes WHERE code = 'XXX'`

### "Redis connection error"
- Verify container is running: `docker ps`
- Check port mapping: `docker port redis-container`
- Test connection: `redis-cli -h localhost -p 6379 ping`

### "Email not sending"
- Verify `RESEND_API_KEY`
- Check Resend dashboard for logs
- Update `from` address in code with your verified domain

## File Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── request-access/page.tsx    ✅ New: Request access form
│   │   ├── signup/page.tsx             ✅ Updated: Code validation
│   │   └── signin/page.tsx             ⏳ Magic link pending
│   └── api/
│       ├── auth/
│       │   ├── request-access/         ✅ New: Submit request
│       │   ├── generate-access-code/   ✅ Updated: Rate limiting
│       │   ├── validate-access-code/   ✅ Existing
│       │   └── use-access-code/        ✅ Existing
│       └── admin/
│           └── access-requests/        ✅ New: All admin endpoints
├── components/
│   └── TurnstileCaptcha.tsx           ✅ New: CAPTCHA component
├── lib/
│   ├── redis.ts                        ✅ New: Redis client
│   └── rate-limit.ts                   ✅ New: Rate limiting
└── prisma/
    └── schema.prisma                   ✅ Updated: New models

plans/
├── user-request-access-flow.mmd        ✅ New: User flow diagram
├── admin-invitation-flow.mmd           ✅ New: Admin flow diagram
├── auth-system-overview.mmd            ✅ New: Complete overview
└── session-architecture.mmd            ✅ New: Multi-server setup
```

## Next Steps

See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for:
- Completed features
- Pending work (Admin UI, Magic Link, Redis sessions)
- Deployment checklist
- Testing requirements

## Support

For issues or questions:
1. Check [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) troubleshooting section
2. Review mermaid diagrams in `/plans` for workflow clarity
3. Check API endpoint documentation above
4. Verify environment variables are set correctly
