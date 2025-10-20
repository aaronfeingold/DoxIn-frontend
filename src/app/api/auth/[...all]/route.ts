import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

const handler = toNextJsHandler(auth);

// Wrap handlers with error logging
export async function GET(req: NextRequest) {
  try {
    return await handler.GET(req);
  } catch (error) {
    console.error("=== Better Auth GET Error ===");
    console.error("URL:", req.url);
    console.error("Error:", error);
    console.error("Stack:", error instanceof Error ? error.stack : "No stack");
    console.error("===========================");
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handler.POST(req);
  } catch (error) {
    console.error("=== Better Auth POST Error ===");
    console.error("URL:", req.url);
    console.error("Error:", error);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : "Unknown"
    );
    console.error("Stack:", error instanceof Error ? error.stack : "No stack");
    console.error("============================");
    throw error;
  }
}
