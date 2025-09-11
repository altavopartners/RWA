"use client";

import { type ReactNode, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { WalletConnectProvider } from "@/hooks/useWalletConnect";
import ConnectWallet from "@/components/ConnectWallet";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <WalletConnectProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                {children}
                <ConnectWallet />
              </TooltipProvider>
            </CartProvider>
          </WalletConnectProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
