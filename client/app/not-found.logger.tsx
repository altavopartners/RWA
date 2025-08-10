// client/app/not-found.logger.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PathLogger() {
  const pathname = usePathname();
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", pathname);
  }, [pathname]);
  return null;
}
