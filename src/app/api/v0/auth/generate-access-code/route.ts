import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  checkRateLimit,
  getCodeGenerationLimiter,
  formatRateLimitError,
} from "@/lib/rate-limit";
import { serverConfig } from "@/config/server";
import { prisma } from "@/lib/prisma";

// Generate a secure 12-character access code
function generateAccessCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const codeLength = 12;
  let code = "";

  // Use crypto for secure random generation
  const randomValues = new Uint32Array(codeLength);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < codeLength; i++) {
    code += chars[randomValues[i] % chars.length];
  }

  return code;
}

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, isActive: true },
    });

    if (!user || user.role !== "admin" || !user.isActive) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Check rate limit (50 codes per day per admin)
    const limiter = getCodeGenerationLimiter();
    const rateLimitResult = await checkRateLimit(limiter, session.user.id);

    if (!rateLimitResult.allowed) {
      return formatRateLimitError(rateLimitResult.retryAfter || 86400);
    }

    // Generate a unique access code
    let accessCode = generateAccessCode();
    let existingCode = await prisma.accessCode.findUnique({
      where: { code: accessCode },
    });

    // Regenerate if code already exists (very unlikely but possible)
    while (existingCode) {
      accessCode = generateAccessCode();
      existingCode = await prisma.accessCode.findUnique({
        where: { code: accessCode },
      });
    }

    // Set expiration to 24 hours from now
    const expiryHours = 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);

    // Create access code record
    const newAccessCode = await prisma.accessCode.create({
      data: {
        code: accessCode,
        isUsed: false,
        expiresAt,
        generatedBy: session.user.id,
        generationType: "admin_invite",
      },
    });

    // Get the base URL for the invitation link
    const baseUrl =
      serverConfig.betterAuthUrl || req.headers.get("origin") || "";
    const invitationUrl = `${baseUrl}/auth/signup?accessCode=${accessCode}`;

    console.log(
      `Generated access code ${accessCode} (expires in ${expiryHours}h)`
    );

    return NextResponse.json(
      {
        access_code: newAccessCode.code,
        expires_at: newAccessCode.expiresAt.toISOString(),
        expiry_hours: expiryHours,
        invitation_url: invitationUrl,
        message: "Access code generated successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating access code:", error);
    return NextResponse.json(
      { error: "Failed to generate access code" },
      { status: 500 }
    );
  }
}
