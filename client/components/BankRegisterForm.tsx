"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bankRegister } from "@/lib/bankAuth";

export default function BankRegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [bankId, setBankId] = useState<string | undefined>(undefined); // optionnel
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await bankRegister({ email, password, name, phone, bankId });
      router.replace("/bank-dashboard");
    } catch (err: any) {
      setError(err?.message || "Register failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6 rounded-2xl shadow bg-white">
      <h1 className="text-2xl font-semibold mb-4">Create Bank Account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Full name</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="text" value={name} onChange={e=>setName(e.target.value)}
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="email@bank.com" required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Phone (optional)</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="tel" value={phone} onChange={e=>setPhone(e.target.value)}
            placeholder="+21612345678"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="password" value={password} onChange={e=>setPassword(e.target.value)}
            placeholder="••••••••" required minLength={8}
          />
        </div>

        {/* Si tu veux lier à une bank précise (optionnel) :
        <div>
          <label className="block text-sm mb-1">Bank ID (optional)</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={bankId ?? ""} onChange={e=>setBankId(e.target.value || undefined)}
            placeholder="bank uuid"
          />
        </div> */}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md py-2 border bg-black text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Register"}
        </button>

        <p className="text-sm text-center mt-2">
          Already have an account?{" "}
          <a className="underline" href="/bank-auth/login">Login</a>
        </p>
      </form>
    </div>
  );
}
