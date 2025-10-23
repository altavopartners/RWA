// client/app/bank-auth/login/page.tsx
"use client";
import BankLoginForm from "@/components/BankLoginForm";
import AuthShell from "@/components/ui/AuthShell";
//import BankLoginForm from "@/components/ui/BankLoginForm";

export default function Page() {
  return (
    <AuthShell title="Connect" subtitle="Access your customer area.">
      <BankLoginForm />
    </AuthShell>
  );
}
