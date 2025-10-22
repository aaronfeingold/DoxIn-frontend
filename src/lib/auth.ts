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
import { randomUUID } from "crypto";
import { Resend } from "resend";
import { getSessionRedisClient } from "./redis";
import { serverConfig } from "@/config/server";
import { getMagicLinkEmailHtml } from "./magic-link";
import { prisma } from "./prisma";

const resend = new Resend(serverConfig.resendApiKey);

// Get Redis client for sessions (DB 2)
const sessionRedis = getSessionRedisClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // No email verification for now
    sendEmailVerificationOnSignUp: false,
  },
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      // This is used for magic link authentication
      const magicLinkUrl = `${serverConfig.betterAuthUrl}/api/auth/verify-email?token=${token}&callbackURL=/dashboard`;

      await resend.emails.send({
        from: "Invoice Platform <noreply@doxin.xyz>", // Update with your domain
        to: user.email,
        subject: "Sign in to your account",
        html: getMagicLinkEmailHtml(user.name || "User", magicLinkUrl),
        tags: [
          { name: "category", value: "magic_link" },
          { name: "user_id", value: user.id },
        ],
      });
    },
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

  // Use Redis for session storage (Better Auth official approach)
  // See: https://www.better-auth.com/docs/concepts/database#secondary-storage
  secondaryStorage: {
    get: async (key) => {
      console.log("[Better Auth Redis] GET key:", key);
      const value = await sessionRedis.get(key);
      console.log(
        "[Better Auth Redis] GET result:",
        value ? "FOUND" : "NOT FOUND"
      );
      return value;
    },
    set: async (key, value, ttl) => {
      console.log("[Better Auth Redis] SET key:", key, "TTL:", ttl, "seconds");

      // Enrich session data with full user information for Flask backend
      // Parse the value to check if it's a session and enrich it
      try {
        const sessionData = JSON.parse(value);

        // If this is a session object (has userId), enrich it with full user data
        if (sessionData && sessionData.userId) {
          const user = await prisma.user.findUnique({
            where: { id: sessionData.userId },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              isActive: true,
              emailVerified: true,
              image: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          if (user) {
            // Add full user object to session data for Flask backend consumption
            sessionData.user = {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              isActive: user.isActive,
              emailVerified: user.emailVerified,
              image: user.image,
              createdAt: user.createdAt?.toISOString(),
              updatedAt: user.updatedAt?.toISOString(),
            };

            // Also add top-level fields for backwards compatibility
            sessionData.userEmail = user.email;
            sessionData.userRole = user.role;

            console.log(
              "[Better Auth Redis] Enriched session with user data:",
              {
                userId: user.id,
                email: user.email,
                role: user.role,
              }
            );

            value = JSON.stringify(sessionData);
          }
        }
      } catch (err) {
        // If parsing fails or it's not a session, just store as-is
        console.log(
          "[Better Auth Redis] Not a session object or parse error, storing as-is"
        );
      }

      // ioredis syntax - TTL is in seconds
      if (ttl) {
        await sessionRedis.set(key, value, "EX", ttl);
      } else {
        await sessionRedis.set(key, value);
      }
    },
    delete: async (key) => {
      console.log("[Better Auth Redis] DELETE key:", key);
      await sessionRedis.del(key);
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieName: "better-auth.session",
  },
  jwt: {
    expiresIn: 60 * 60 * 24, // 1 day
  },
  secret: serverConfig.betterAuthSecret!,
});
