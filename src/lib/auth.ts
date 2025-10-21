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
import { Resend } from "resend";
import { getSessionRedisClient } from "./redis";
import { serverConfig } from "@/config/server";

const prisma = new PrismaClient();
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

/**
 * Magic Link Email HTML Template
 */
function getMagicLinkEmailHtml(name: string, magicLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In to Your Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; text-align: center;">
                Sign In to Your Account
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi ${name},
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Click the button below to sign in to your account. This link will expire in 15 minutes for security reasons.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">
                  Sign In Now
                </a>
              </div>

              <!-- Alternative Link -->
              <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; padding: 15px; background-color: #f8f9fa; border-radius: 4px; word-break: break-all; font-size: 12px; font-family: 'Courier New', monospace; color: #666666;">
                ${magicLink}
              </p>

              <!-- Security Notice -->
              <div style="margin: 30px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>Security Note:</strong> If you didn't request this sign-in link, you can safely ignore this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #666666; font-size: 12px; text-align: center; line-height: 1.6;">
                This link will expire in 15 minutes. If you need assistance, please contact our support team.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
