/**
 * Better Auth Client-Side Configuration
 *
 * This file provides React hooks and client-side auth utilities.
 * Use these in client components (marked with "use client").
 *
 * Available hooks:
 * - useSession() - Get current session data reactively
 * - signIn() - Sign in with various providers
 * - signOut() - Sign out current user
 *
 * For server-side session management in API routes, use @/lib/auth.ts instead.
 */
"use client";

import { createAuthClient } from "better-auth/react";
import { clientConfig } from "@/config/client";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
  basePath: `${clientConfig.nextApiVer}/auth`,
});

export const { useSession, signIn, signOut } = authClient;
