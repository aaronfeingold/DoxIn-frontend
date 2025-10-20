/**
 * Better Auth Server-Side Configuration
 *
 * This file handles:
 * - Better Auth instance configuration (Google OAuth + Magic Link)
 * - Server-side authentication helpers for API routes
 * - Flask API integration utilities
 *
 * Usage in API routes/server actions
 *   import { auth } from "@/lib/auth";
 *   import { headers } from "next/headers";
 *
 *   const session = await auth.api.getSession({ headers: await headers() });
 *
 * For client-side session management, use @/lib/auth-client.ts instead.
 */
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // No email verification for now
  },
  advanced: {
    generateId: () => randomUUID(),
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:65228",
    "http://10.0.0.27:3000",
    "http://10.0.0.27:3001",
  ],
  user: {
    // Include additional fields in the session
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        required: false,
      },
      isActive: {
        type: "boolean",
        defaultValue: true,
        required: false,
      },
    },
  },
  plugins: [],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  jwt: {
    expiresIn: 60 * 60 * 24, // 1 day
  },
  secret: process.env.BETTER_AUTH_SECRET!,
});
