"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bankLogin } from "@/lib/bankAuth";

export default function BankLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) return setError("Please enter a valid email.");
    if (!password) return setError("Please enter your password.");

    setSubmitting(true);
    try {
      await bankLogin({ email, password });
      router.replace("/bank-dashboard");
    } catch (err: any) {
      let message = "Sign-in failed.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label className="block text-sm mb-1" htmlFor="email">Email</label>
        <input
          id="email"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email@bank.com"
          autoComplete="username"
          required
        />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="password">Password</label>
        <div className="relative">
          <input
            id="password"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 pr-12"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:opacity-80"
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide" : "Show"}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl py-3 font-medium shadow-sm bg-slate-900 text-white hover:opacity-95 disabled:opacity-60"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-sm text-center mt-2 text-slate-700 dark:text-slate-200">
        No account?{" "}
        <a className="underline" href="/bank-auth/register">Create one</a>
      </p>
    </form>
  );
}
