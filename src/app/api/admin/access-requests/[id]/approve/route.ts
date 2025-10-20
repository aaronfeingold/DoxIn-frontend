/**
 * Approve Access Request Endpoint
 *
 * Approves a user's access request and optionally generates access code.
 * Requires admin authentication.
 *
 * POST /api/admin/access-requests/[id]/approve
 * Body: { generateCode?: boolean, sendEmail?: boolean }
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Find the access request
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id },
    });

    if (!accessRequest) {
      return NextResponse.json(
        { error: "Access request not found" },
        { status: 404 }
      );
    }

    // Check if already reviewed
    if (accessRequest.status !== "pending") {
      return NextResponse.json(
        { error: `Access request already ${accessRequest.status}` },
        { status: 400 }
      );
    }

    // Update access request status
    const updatedRequest = await prisma.accessRequest.update({
      where: { id },
      data: {
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Access request approved successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error approving access request:", error);
    return NextResponse.json(
      { error: "Failed to approve access request" },
      { status: 500 }
    );
  }
}
