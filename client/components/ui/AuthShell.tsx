"use client";

import { PropsWithChildren } from "react";

export default function AuthShell({
  title,
  subtitle = "Accès sécurisé à votre banque.",
  children,
}: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* background gradient + blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      <div className="pointer-events-none absolute -top-1/3 -left-1/3 h-[60rem] w-[60rem] rounded-full blur-3xl opacity-30 bg-[radial-gradient(ellipse_at_center,theme(colors.sky.200),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,theme(colors.sky.900),transparent_60%)]" />
      <div className="pointer-events-none absolute -bottom-1/3 -right-1/3 h-[60rem] w-[60rem] rounded-full blur-3xl opacity-30 bg-[radial-gradient(ellipse_at_center,theme(colors.indigo.200),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,theme(colors.indigo.900),transparent_60%)]" />

      {/* subtle noise */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
           style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22><path fill=%22%23000%22 fill-opacity=%220.12%22 d=%22M0 0h1v1H0z%22/></svg>')" }} />

      {/* content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow">
              {/* simple bank glyph */}
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                <path d="M3 9.5L12 4l9 5.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M5 10h14v8H5z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M7.5 18V12m4 6v-6m4 6v-6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-300">{subtitle}</p>
          </div>

          <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/60 backdrop-blur-xl shadow-xl shadow-slate-200/60 dark:shadow-black/30 p-6 sm:p-8">
            {children}
          </div>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Hex-Port  — All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
