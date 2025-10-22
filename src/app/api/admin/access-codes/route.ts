/**
 * Admin Access Codes API
 *
 * Allows admins to view all access codes with filtering and statistics.
 * Requires admin authentication.
 *
 * GET /api/admin/access-codes
 * Query params: status?, type?, page?, limit?, search?
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { WhereClause } from "@/types/database";

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
    const statusFilter = searchParams.get("status") || undefined; // unused, used, expired, all
    const typeFilter = searchParams.get("type") || undefined; // admin_invite, user_request
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const search = searchParams.get("search") || undefined;

    // Build where clause
    const where: WhereClause = {};

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      const now = new Date();
      switch (statusFilter) {
        case "unused":
          where.isUsed = false;
          where.expiresAt = { gt: now };
          break;
        case "used":
          where.isUsed = true;
          break;
        case "expired":
          where.isUsed = false;
          where.expiresAt = { lte: now };
          break;
      }
    }

    // Type filter
    if (typeFilter && typeFilter !== "all") {
      where.generationType = typeFilter;
    }

    // Search filter
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { usedByEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const totalCount = await prisma.accessCode.count({ where });

    // Get paginated results
    const accessCodes = await prisma.accessCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        generatedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        accessRequest: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Calculate statistics
    const stats = {
      total: await prisma.accessCode.count(),
      unused: await prisma.accessCode.count({
        where: {
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
      }),
      used: await prisma.accessCode.count({
        where: { isUsed: true },
      }),
      expired: await prisma.accessCode.count({
        where: {
          isUsed: false,
          expiresAt: { lte: new Date() },
        },
      }),
      adminInvite: await prisma.accessCode.count({
        where: { generationType: "admin_invite" },
      }),
      userRequest: await prisma.accessCode.count({
        where: { generationType: "user_request" },
      }),
    };

    return NextResponse.json({
      codes: accessCodes,
      stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching access codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch access codes" },
      { status: 500 }
    );
  }
}
