"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie"; // ✅ add cookies like in login
import { bankRegister } from "@/lib/bankAuth";

// Password policy: min 8 chars, at least 1 uppercase and 1 digit
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function BankRegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);       // 👁️
  const [showConfirm, setShowConfirm] = useState(false);         // 👁️
  const [bankId, setBankId] = useState<string | undefined>(undefined); // optional
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pwChecks = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      digit: /\d/.test(password),
    }),
    [password]
  );

  const isPasswordValid = PASSWORD_REGEX.test(password);
  const isConfirmValid = confirm.length > 0 && confirm === password;

  function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Please enter your full name.");
    if (!isValidEmail(email)) return setError("Please enter a valid email.");
    if (!isPasswordValid)
      return setError("Password must be at least 8 characters and include 1 uppercase letter and 1 digit.");
    if (!isConfirmValid) return setError("Password confirmation does not match.");

    setSubmitting(true);
    try {
      // Call backend
      const data = await bankRegister({ email, password, name, phone, bankId });

      // ✅ Mirror login: store auth in cookies for 7 days
      //    (httpOnly cookies must be set server-side; this is client-side only like your login form)
      if (data?.token) {
        Cookies.set("bank_auth_token", data.token, { expires: 7 });
      }
      if (data?.userBank) {
        Cookies.set("bank_user", JSON.stringify(data.userBank), { expires: 7 });
      }

      // Go to dashboard
      router.replace("/bank-dashboard");
    } catch (err: any) {
      // Try to extract clean error message
      let message = "Registration failed.";
      if (err?.response?.data?.message) message = err.response.data.message;
      else if (err?.message?.includes("Email already exists")) message = "Email already exists.";
      else if (err?.message) message = err.message.split("—")[0].trim();
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const Rule = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
    <li className={`${ok ? "text-green-600" : "text-slate-500"} flex items-center gap-2`}>
      <span className="text-base leading-none">{ok ? "✓" : "•"}</span>
      <span className="text-xs">{children}</span>
    </li>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label className="block text-sm mb-1" htmlFor="name">Full name</label>
        <input
          id="name"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Jane Doe"
          autoComplete="name"
          required
        />
      </div>

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
        <label className="block text-sm mb-1" htmlFor="phone">Phone (optional)</label>
        <input
          id="phone"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5"
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+21612345678"
          autoComplete="tel"
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
            autoComplete="new-password"
            required
            pattern="^(?=.*[A-Z])(?=.*\d).{8,}$"
            title="At least 8 characters, 1 uppercase letter, and 1 digit."
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:opacity-80"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {/* rules + strength bar */}
        <div className="mt-2">
          <div className="h-1 w-full rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all ${
                !password
                  ? "w-0"
                  : isPasswordValid
                  ? "w-full bg-green-500"
                  : pwChecks.length && (pwChecks.uppercase || pwChecks.digit)
                  ? "w-2/3 bg-yellow-500"
                  : "w-1/3 bg-red-500"
              }`}
            />
          </div>
          <ul className="mt-2 space-y-1">
            <Rule ok={pwChecks.length}>At least 8 characters</Rule>
            <Rule ok={pwChecks.uppercase}>Contains an uppercase letter</Rule>
            <Rule ok={pwChecks.digit}>Contains a digit</Rule>
          </ul>
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="confirm">Confirm password</label>
        <div className="relative">
          <input
            id="confirm"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 pr-12"
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            aria-invalid={confirm.length > 0 && !isConfirmValid}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(s => !s)}
            className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:opacity-80"
            aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirm ? "🙈" : "👁️"}
          </button>
        </div>
        {confirm.length > 0 && !isConfirmValid && (
          <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>
        )}
      </div>

      {/* Optional: link to a specific bank */}
      {/*
      <div>
        <label className="block text-sm mb-1" htmlFor="bankId">Bank ID (optional)</label>
        <input
          id="bankId"
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5"
          value={bankId ?? ""}
          onChange={e => setBankId(e.target.value || undefined)}
          placeholder="bank uuid"
        />
      </div>
      */}

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !isPasswordValid || !isConfirmValid}
        className="w-full rounded-xl py-3 font-medium shadow-sm bg-slate-900 text-white hover:opacity-95 disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Create account"}
      </button>

      <p className="text-sm text-center mt-2 text-slate-700 dark:text-slate-200">
        Already have an account?{" "}
        <a className="underline" href="/bank-auth/login">Sign in</a>
      </p>
    </form>
  );
}
