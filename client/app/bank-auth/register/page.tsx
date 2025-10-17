// client/app/bank-auth/register/page.tsx
"use client";
import BankRegisterForm from "@/components/BankRegisterForm";
import AuthShell from "@/components/ui/AuthShell";


export default function Page() {
  return (
    <AuthShell title="Create an account" subtitle="Create a secure access to your bank.">
      <BankRegisterForm />
    </AuthShell>
  );
}