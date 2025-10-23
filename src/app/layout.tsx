import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ProcessingProvider } from "@/providers/ProcessingProvider";
import { AppLayoutWrapper } from "@/components/AppLayoutWrapper";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DoxIn - Transform Invoices Into Structured Data",
  description: "AI-powered invoice extraction with industry-leading accuracy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${poppins.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <ProcessingProvider>
              <Suspense fallback={<div>Loading...</div>}>
                <AppLayoutWrapper>{children}</AppLayoutWrapper>
              </Suspense>
              <Toaster />
            </ProcessingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
