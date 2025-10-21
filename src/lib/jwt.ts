/**
 * Helper to fetch a short-lived JWT from the Next.js bridge route.
 * The token stays in memory on the client; avoid persisting it long term.
 */
export async function fetchJwtToken(): Promise<{
  token: string;
  expires_at: string;
}> {
  const resp = await fetch("/api/get-jwt", {
    method: "POST",
    credentials: "include",
  });

  if (!resp.ok) {
    throw new Error("Could not fetch JWT");
  }

  return resp.json();
}
