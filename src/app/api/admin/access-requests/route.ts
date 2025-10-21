/**
 * Admin Access Requests Management API
 *
 * Allows admins to view and manage user access requests.
 * Requires admin authentication.
 *
 * GET /api/admin/access-requests
 * Query params: status?, page?, limit?, search?
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || undefined;

    // Build where clause
    const where: any = {};

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const totalCount = await prisma.accessRequest.count({ where });

    // Get paginated results
    const accessRequests = await prisma.accessRequest.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        accessCode: {
          select: {
            id: true,
            code: true,
            isUsed: true,
            expiresAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      requests: accessRequests,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching access requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch access requests" },
      { status: 500 }
    );
  }
}
