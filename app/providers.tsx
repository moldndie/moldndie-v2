"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";
import { useCartMigration } from "@/hooks/useCartMigration";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function CartMigration() {
  useCartMigration();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
        <CartMigration />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryProvider>
  );
}
