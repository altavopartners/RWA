// app/bank/page.tsx  (or wherever your route lives)
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import BankDocumentsPage from "@/components/BankDocumentsPage"; // can be server or client

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get("bank_auth_token")?.value;

  if (!token) {
    redirect("/bank-auth/login");
  }

  return <BankDocumentsPage />;
}