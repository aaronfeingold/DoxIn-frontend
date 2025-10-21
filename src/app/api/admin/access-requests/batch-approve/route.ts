/**
 * Batch Approve Access Requests Endpoint
 *
 * Approves multiple access requests at once.
 * Requires admin authentication.
 *
 * POST /api/admin/access-requests/batch-approve
 * Body: { requestIds: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { requestIds } = body;

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json(
        { error: "requestIds array is required" },
        { status: 400 }
      );
    }

    // Update all pending requests to approved
    const result = await prisma.accessRequest.updateMany({
      where: {
        id: { in: requestIds },
        status: "pending", // Only approve pending requests
      },
      data: {
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Approved ${result.count} request(s)`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error batch approving requests:", error);
    return NextResponse.json(
      { error: "Failed to approve requests" },
      { status: 500 }
    );
  }
}
