"use client";

import { ReactNode } from "react";
import { AuthContextProvider } from "@/contexts/AuthContext";

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}
