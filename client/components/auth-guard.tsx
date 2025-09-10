"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ShieldCheck } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
  message?: string;
}

export function AuthGuard({
  children,
  fallback,
  requireAuth = true,
  message = "Please connect your wallet to continue",
}: AuthGuardProps) {
  const { isConnected, connectWallet, isLoading } = useAuth();

  if (!requireAuth || isConnected) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="p-8 text-center max-w-md mx-auto">
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            Authentication Required
          </h3>
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
        <Button onClick={connectWallet} disabled={isLoading} className="w-full">
          <Wallet className="w-4 h-4 mr-2" />
          {isLoading ? "Connecting..." : "Connect Wallet"}
        </Button>
      </Card>
    </div>
  );
}

export function useAuthAction() {
  const { isConnected, connectWallet } = useAuth();

  const requireAuth = async (action: () => void | Promise<void>) => {
    if (!isConnected) {
      await connectWallet();
      return;
    }
    await action();
  };

  return { requireAuth, isConnected };
}
