import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accessCode } = body;

    if (!accessCode || typeof accessCode !== "string") {
      return NextResponse.json(
        { valid: false, error: "Access code is required" },
        { status: 400 }
      );
    }

    // Trim and normalize the access code
    const normalizedCode = accessCode.trim().toUpperCase();

    // Query the access code from the database
    const codeRecord = await prisma.accessCode.findUnique({
      where: { code: normalizedCode },
    });

    if (!codeRecord) {
      return NextResponse.json(
        { valid: false, error: "Access code not found" },
        { status: 404 }
      );
    }

    // Check if already used
    if (codeRecord.isUsed) {
      return NextResponse.json(
        { valid: false, error: "Access code has already been used" },
        { status: 400 }
      );
    }

    // Check if expired
    const now = new Date();
    if (now > codeRecord.expiresAt) {
      return NextResponse.json(
        { valid: false, error: "Access code has expired" },
        { status: 400 }
      );
    }

    // Access code is valid
    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error("Error validating access code:", error);
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
