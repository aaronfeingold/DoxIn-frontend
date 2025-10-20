/**
 * Reject Access Request Endpoint
 *
 * Rejects a user's access request with an optional reason.
 * Requires admin authentication.
 *
 * POST /api/admin/access-requests/[id]/reject
 * Body: { reason?: string }
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
    const body = await request.json();
    const { reason } = body;

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
        status: "rejected",
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        rejectionReason: reason || null,
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

    // TODO: Send rejection notification email to user

    return NextResponse.json({
      success: true,
      message: "Access request rejected",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error rejecting access request:", error);
    return NextResponse.json(
      { error: "Failed to reject access request" },
      { status: 500 }
    );
  }
}
