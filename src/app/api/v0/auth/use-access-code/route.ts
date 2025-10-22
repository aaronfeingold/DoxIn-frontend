import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accessCode, email } = body;

    if (!accessCode || typeof accessCode !== "string") {
      return NextResponse.json(
        { error: "Access code is required" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Normalize the access code
    const normalizedCode = accessCode.trim().toUpperCase();

    // Query the access code from the database
    const codeRecord = await prisma.accessCode.findUnique({
      where: { code: normalizedCode },
    });

    if (!codeRecord) {
      return NextResponse.json(
        { error: "Access code not found" },
        { status: 404 }
      );
    }

    // Check if already used
    if (codeRecord.isUsed) {
      return NextResponse.json(
        { error: "Access code has already been used" },
        { status: 400 }
      );
    }

    // Check if expired
    const now = new Date();
    if (now > codeRecord.expiresAt) {
      return NextResponse.json(
        { error: "Access code has expired" },
        { status: 400 }
      );
    }

    // Mark as used
    await prisma.accessCode.update({
      where: { code: normalizedCode },
      data: {
        isUsed: true,
        usedByEmail: email,
        usedAt: now,
      },
    });

    console.log(`Access code ${normalizedCode} marked as used by ${email}`);

    return NextResponse.json(
      { success: true, message: "Access code marked as used" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking access code as used:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
