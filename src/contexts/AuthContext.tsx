"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSession } from "@/lib/auth-client";
import type { User } from "@prisma/client";
import { fetchJwtToken } from "@/lib/jwt";
import { clientConfig } from "@/config/client";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  jwtToken: string | null;
  jwtExpiresAt: string | null;
  isJwtLoading: boolean;
  jwtError: string | null;
  refreshJwtToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface SessionInfoResponse {
  user_id: string;
  email: string;
  role: string;
  last_login?: string | null;
  is_active?: boolean;
  name?: string | null;
}

const mapSessionInfoToUser = (session: SessionInfoResponse): User => {
  const now = new Date();

  return {
    id: session.user_id,
    email: session.email,
    name: session.name ?? null,
    image: null,
    emailVerified: false,
    accessCode: null,
    role: session.role,
    isActive: session.is_active ?? true,
    lastLogin: session.last_login ? new Date(session.last_login) : null,
    createdAt: now,
    updatedAt: now,
  };
};

export function AuthContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [jwtExpiresAt, setJwtExpiresAt] = useState<string | null>(null);
  const [isJwtLoading, setIsJwtLoading] = useState(false);
  const [jwtError, setJwtError] = useState<string | null>(null);

  const loadUser = useCallback(
    async (options: { showLoading?: boolean; token?: string } = {}) => {
      const { showLoading = true, token } = options;
      const activeToken = token ?? jwtToken;

      if (!activeToken) {
        if (showLoading) {
          setIsLoading(false);
        }
        setUser(null);
        return;
      }

      if (showLoading) setIsLoading(true);
      setError(null);

      try {
        const { apiUrl } = clientConfig;

        if (!apiUrl) {
          throw new Error("API URL not configured");
        }

        const sessionInfoUrl = `${apiUrl}/api/v1/auth/session-info`;

        const sessionResponse = await fetch(sessionInfoUrl, {
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
          credentials: "include",
          cache: "no-store",
        });

        if (!sessionResponse.ok) {
          throw new Error("Failed to load session info");
        }

        const sessionData: SessionInfoResponse = await sessionResponse.json();

        try {
          const profileResponse = await fetch("/api/user/profile", {
            credentials: "include",
            cache: "no-store",
          });

          if (profileResponse.ok) {
            const userData = await profileResponse.json();
            setUser(userData as User);
            return;
          }

          console.warn(
            "User profile request failed, using session info fallback:",
            profileResponse.status
          );
        } catch (profileError) {
          console.warn(
            "User profile request error, using session info fallback:",
            profileError
          );
        }

        setUser(mapSessionInfoToUser(sessionData));
      } catch (err) {
        console.error("Failed to load user:", err);
        setError(err instanceof Error ? err.message : "Failed to load user");
        setUser(null);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [jwtToken]
  );

  const loadJwtToken = useCallback(async () => {
    if (!session?.user) {
      setJwtToken(null);
      setJwtExpiresAt(null);
      setJwtError(null);
      return null;
    }

    setIsJwtLoading(true);
    setJwtError(null);

    try {
      const { token, expires_at } = await fetchJwtToken();
      setJwtToken(token);
      setJwtExpiresAt(expires_at);
      return token;
    } catch (err) {
      console.error("Failed to fetch JWT token:", err);
      setJwtToken(null);
      setJwtExpiresAt(null);
      setJwtError(
        err instanceof Error ? err.message : "Failed to fetch JWT token"
      );
      return null;
    } finally {
      setIsJwtLoading(false);
    }
  }, [session?.user]);

  const refreshUser = async () => {
    const token = jwtToken ?? (await loadJwtToken());

    if (!token) {
      setUser(null);
      return;
    }

    await loadUser({ showLoading: true, token });
  };

  const refreshJwtToken = async () => {
    await loadJwtToken();
  };

  useEffect(() => {
    let isActive = true;

    if (isPending) {
      setIsLoading(true);
      return;
    }

    if (!session?.user) {
      setUser(null);
      setIsLoading(false);
      setJwtToken(null);
      setJwtExpiresAt(null);
      setJwtError(null);
      return;
    }

    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const token = await loadJwtToken();

        if (!isActive) return;

        if (!token) {
          setUser(null);
          return;
        }

        await loadUser({ showLoading: false, token });
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      isActive = false;
    };
  }, [session?.user, isPending, loadJwtToken, loadUser]);

  const value: AuthContextType = {
    user,
    isLoading: isLoading || isPending || isJwtLoading,
    isAuthenticated: Boolean(user),
    error,
    refreshUser,
    jwtToken,
    jwtExpiresAt,
    isJwtLoading,
    jwtError,
    refreshJwtToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return context;
}
