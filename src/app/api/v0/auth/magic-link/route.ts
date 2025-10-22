/**
 * Magic Link Request API
 *
 * Sends a magic link (passwordless login) to the user's email.
 * Rate limited to prevent abuse.
 *
 * POST /api/auth/magic-link
 * Body: { email }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  checkRateLimit,
  getMagicLinkLimiter,
  formatRateLimitError,
} from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check rate limit (3 requests per 15 minutes per email)
    const limiter = getMagicLinkLimiter();
    const rateLimitResult = await checkRateLimit(limiter, email.toLowerCase());

    if (!rateLimitResult.allowed) {
      return formatRateLimitError(rateLimitResult.retryAfter || 900);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // For security, don't reveal if user exists or not
      // Return success message either way
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a sign-in link has been sent.",
      });
    }

    // Send magic link via Better Auth's email verification
    // This will trigger the sendVerificationEmail function in auth.ts
    try {
      await auth.api.sendVerificationEmail({
        body: {
          email: email.toLowerCase(),
          callbackURL: "/dashboard",
        },
      });

      return NextResponse.json({
        success: true,
        message: "A sign-in link has been sent to your email.",
      });
    } catch (error) {
      console.error("Error sending magic link:", error);
      // Don't reveal specific error to user for security
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a sign-in link has been sent.",
      });
    }
  } catch (error) {
    console.error("Error in magic link request:", error);
    return NextResponse.json(
      { error: "Failed to send magic link" },
      { status: 500 }
    );
  }
}
