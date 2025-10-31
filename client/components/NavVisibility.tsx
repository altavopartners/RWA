"use client";

import { usePathname } from "next/navigation";
import NavClient from "@/components/NavClient";

export default function NavVisibility({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/bank");

  return (
    <>
      {!hideNav && <NavClient />}
      {children}
    </>
  );
}