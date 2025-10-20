import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update lastLogin timestamp
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        lastLogin: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking login:", error);
    return NextResponse.json(
      { error: "Failed to track login" },
      { status: 500 }
    );
  }
}
