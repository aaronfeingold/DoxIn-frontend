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
    async (showLoading = true) => {
      if (!session?.user) {
        setUser(null);
        setIsLoading(false);
        setJwtToken(null);
        setJwtExpiresAt(null);
        setJwtError(null);
        return;
      }

      if (showLoading) setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/user/profile");
        if (!response.ok) {
          throw new Error("Failed to load user profile");
        }

        const userData = await response.json();
        setUser(userData as User);
      } catch (err) {
        console.error("Failed to load user:", err);
        setError(err instanceof Error ? err.message : "Failed to load user");
        setUser(null);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [session?.user]
  );

  const loadJwtToken = useCallback(async () => {
    if (!session?.user) {
      setJwtToken(null);
      setJwtExpiresAt(null);
      setJwtError(null);
      return;
    }

    setIsJwtLoading(true);
    setJwtError(null);

    try {
      const { token, expires_at } = await fetchJwtToken();
      setJwtToken(token);
      setJwtExpiresAt(expires_at);
    } catch (err) {
      console.error("Failed to fetch JWT token:", err);
      setJwtToken(null);
      setJwtExpiresAt(null);
      setJwtError(
        err instanceof Error ? err.message : "Failed to fetch JWT token"
      );
    } finally {
      setIsJwtLoading(false);
    }
  }, [session?.user]);

  const refreshUser = async () => {
    await loadUser(false);
  };

  const refreshJwtToken = async () => {
    await loadJwtToken();
  };

  useEffect(() => {
    if (isPending) {
      setIsLoading(true);
      return;
    }

    if (session?.user) {
      loadUser(true);
      loadJwtToken();
    } else {
      setUser(null);
      setIsLoading(false);
      setJwtToken(null);
      setJwtExpiresAt(null);
      setJwtError(null);
    }
  }, [session?.user, isPending, loadUser, loadJwtToken]);

  const value: AuthContextType = {
    user,
    isLoading: isLoading || isPending || isJwtLoading,
    isAuthenticated: !!session?.user,
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
