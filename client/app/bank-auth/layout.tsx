// client/app/bank-auth/layout.tsx
"use client";

import { BankAuthProvider } from "@/hooks/useBankAuth";

export default function BankAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BankAuthProvider>{children}</BankAuthProvider>;
}
