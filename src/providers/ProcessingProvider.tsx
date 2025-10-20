"use client";

import { ReactNode } from "react";
import { ProcessingProvider as ProcessingContextProvider } from "@/contexts/ProcessingContext";
import { NotificationProvider as NotificationContextProvider } from "@/contexts/NotificationContext";

interface Props {
  children: ReactNode;
}

export function ProcessingProvider({ children }: Props) {
  return (
    <ProcessingContextProvider>
      <NotificationContextProvider>{children}</NotificationContextProvider>
    </ProcessingContextProvider>
  );
}
