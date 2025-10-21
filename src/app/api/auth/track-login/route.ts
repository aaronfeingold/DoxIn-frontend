import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { serverConfig } from "@/config/server";

export async function POST() {
  try {
    const headerList = await headers();
    const session = await auth.api.getSession({ headers: headerList });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const flaskBaseUrl = serverConfig.flaskApiUrl;

    if (!flaskBaseUrl) {
      console.error("FLASK_API_URL environment variable is not set");
      return NextResponse.json(
        { error: "Backend URL not configured" },
        { status: 500 }
      );
    }

    const cookieHeader = headerList.get("cookie");
    const flaskHeaders: Record<string, string> = {};

    if (cookieHeader) {
      flaskHeaders.Cookie = cookieHeader;
    }

    const userAgent = headerList.get("user-agent");
    if (userAgent) {
      flaskHeaders["User-Agent"] = userAgent;
    }

    const forwardedFor = headerList.get("x-forwarded-for");
    if (forwardedFor) {
      flaskHeaders["X-Forwarded-For"] = forwardedFor;
    }

    const flaskResponse = await fetch(
      `${flaskBaseUrl}/api/v1/auth/track-login`,
      {
        method: "POST",
        headers: flaskHeaders,
        credentials: "include",
      }
    );

    if (!flaskResponse.ok) {
      const errorPayload = await flaskResponse.json().catch(() => ({}));
      console.error(
        "Flask track-login call failed:",
        flaskResponse.status,
        flaskResponse.statusText,
        errorPayload
      );
      return NextResponse.json(
        { error: "Failed to track login" },
        { status: 500 }
      );
    }

    const payload = await flaskResponse.json().catch(() => ({}));
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Error proxying login tracking:", error);
    return NextResponse.json(
      { error: "Failed to track login" },
      { status: 500 }
    );
  }
}
