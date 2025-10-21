import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const flaskUrl = `${process.env.NEXT_PUBLIC_FLASK_API_URL}/auth/jwt-token`;
    const cookieHeader = req.headers.get("cookie");
    const flaskHeaders: Record<string, string> = {};

    if (cookieHeader) {
      flaskHeaders.Cookie = cookieHeader;
    }

    const flaskResp = await fetch(flaskUrl, {
      method: "POST",
      headers: flaskHeaders,
      credentials: "include",
    });

    if (!flaskResp.ok) {
      console.error(
        "Failed to fetch JWT from Flask:",
        flaskResp.status,
        flaskResp.statusText
      );
      return NextResponse.json(
        { error: "Failed to fetch JWT" },
        { status: 500 }
      );
    }

    const data = await flaskResp.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching JWT:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export const GET = POST;
