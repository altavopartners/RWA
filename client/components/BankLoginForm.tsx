"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bankLogin } from "@/lib/bankAuth";

export default function BankLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await bankLogin({ email, password });
      router.replace("/bank-dashboard"); // redirige après succès
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6 rounded-2xl shadow bg-white">
      <h1 className="text-2xl font-semibold mb-4">Bank Login</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="email@bank.com" required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="password" value={password} onChange={e=>setPassword(e.target.value)}
            placeholder="••••••••" required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md py-2 border bg-black text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Signing in..." : "Login"}
        </button>

        <p className="text-sm text-center mt-2">
          No account?{" "}
          <a className="underline" href="/bank-auth/register">Register</a>
        </p>
      </form>
    </div>
  );
}
