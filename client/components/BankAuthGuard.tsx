"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBankAuth } from "@/hooks/useBankAuth";

export function BankAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useBankAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/bank-auth/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
