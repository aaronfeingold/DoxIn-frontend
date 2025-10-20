/**
 * Access Request API Endpoint
 *
 * Allows users to request access codes for signup.
 * Protected by:
 * - Cloudflare Turnstile CAPTCHA
 * - Rate limiting (3 requests per 24 hours per email)
 *
 * POST /api/auth/request-access
 * Body: { email, name, message?, captchaToken }
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyTurnstileToken } from "@/components/TurnstileCaptcha";
import {
  checkRateLimit,
  getAccessRequestLimiter,
  formatRateLimitError,
} from "@/lib/rate-limit";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, message, captchaToken } = body;

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length < 2 || name.length > 255) {
      return NextResponse.json(
        { error: "Name must be between 2 and 255 characters" },
        { status: 400 }
      );
    }

    // Verify CAPTCHA token
    if (!captchaToken) {
      return NextResponse.json(
        { error: "CAPTCHA token is required" },
        { status: 400 }
      );
    }

    const captchaResult = await verifyTurnstileToken(captchaToken);
    if (!captchaResult.success) {
      return NextResponse.json(
        { error: captchaResult.error || "CAPTCHA verification failed" },
        { status: 400 }
      );
    }

    // Check rate limit (3 requests per 24 hours per email)
    const limiter = getAccessRequestLimiter();
    const rateLimitResult = await checkRateLimit(limiter, email.toLowerCase());

    if (!rateLimitResult.allowed) {
      return formatRateLimitError(rateLimitResult.retryAfter || 86400);
    }

    // Check if user already has a pending request
    const existingRequest = await prisma.accessRequest.findFirst({
      where: {
        email: email.toLowerCase(),
        status: "pending",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error: "You already have a pending access request",
          message:
            "Please wait for admin approval of your existing request before submitting a new one.",
        },
        { status: 409 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Account already exists",
          message:
            "An account with this email already exists. Please sign in instead.",
        },
        { status: 409 }
      );
    }

    // Create access request
    const accessRequest = await prisma.accessRequest.create({
      data: {
        email: email.toLowerCase(),
        name,
        message: message || null,
        status: "pending",
      },
    });

    // TODO: Send notification email to admins about new request
    // This could be done here or via a background job

    return NextResponse.json(
      {
        success: true,
        message:
          "Access request submitted successfully. You will receive an email once your request is reviewed.",
        requestId: accessRequest.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating access request:", error);
    return NextResponse.json(
      { error: "Failed to submit access request" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check request status
 * Query params: ?email=user@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const accessRequest = await prisma.accessRequest.findFirst({
      where: {
        email: email.toLowerCase(),
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        status: true,
        requestedAt: true,
        reviewedAt: true,
      },
    });

    if (!accessRequest) {
      return NextResponse.json(
        { error: "No access request found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      requestId: accessRequest.id,
      status: accessRequest.status,
      requestedAt: accessRequest.requestedAt,
      reviewedAt: accessRequest.reviewedAt,
    });
  } catch (error) {
    console.error("Error fetching access request:", error);
    return NextResponse.json(
      { error: "Failed to fetch access request" },
      { status: 500 }
    );
  }
}
