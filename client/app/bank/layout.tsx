"use client";

import type React from "react";
import { BankSidebar } from "@/components/bank-sidebar";
import { BankAuthProvider } from "@/hooks/useBankAuth";
import { BankAuthGuard } from "@/components/BankAuthGuard";

export default function BankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BankAuthProvider>
      <BankAuthGuard>
        <div className="flex h-screen bg-background">
          <BankSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </BankAuthGuard>
    </BankAuthProvider>
  );
}
