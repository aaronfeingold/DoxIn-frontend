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
import { clientConfig } from "@/config/client";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
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

  const loadUser = useCallback(async () => {
    if (!session?.user) {
      setUser(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const profileResponse = await fetch(
        `${clientConfig.nextApiVer}/user/profile`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!profileResponse.ok) {
        throw new Error(
          `Failed to load user profile: ${profileResponse.status}`
        );
      }

      const userData = await profileResponse.json();
      setUser(userData as User);
    } catch (err) {
      console.error("Failed to load user:", err);
      setError(err instanceof Error ? err.message : "Failed to load user");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  const refreshUser = async () => {
    await loadUser();
  };

  useEffect(() => {
    if (isPending) {
      setIsLoading(true);
      return;
    }

    if (!session?.user) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    void loadUser();
  }, [session?.user, isPending, loadUser]);

  const value: AuthContextType = {
    user,
    isLoading: isLoading || isPending,
    isAuthenticated: Boolean(user),
    error,
    refreshUser,
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
