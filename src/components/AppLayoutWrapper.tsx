"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface AppLayoutWrapperProps {
  children: React.ReactNode;
}

const publicRoutes = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/legal/privacy",
  "/legal/terms",
];

export function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/auth/")
  );

  const showSidebar = !isLoading && isAuthenticated && !isPublicRoute;

  return (
    <>
      {showSidebar && <Sidebar />}
      <main className={cn(showSidebar && "ml-64 transition-all duration-300")}>
        {children}
      </main>
    </>
  );
}
