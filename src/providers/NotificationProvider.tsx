"use client";

import { ReactNode } from "react";
import { NotificationProvider as NotificationContextProvider } from "@/contexts/NotificationContext";

interface Props {
  children: ReactNode;
}

export function NotificationProvider({ children }: Props) {
  return <NotificationContextProvider>{children}</NotificationContextProvider>;
}
