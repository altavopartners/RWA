"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { debug } from "@/lib/debug";

export default function PathLogger() {
  const pathname = usePathname();
  useEffect(() => {
    debug.error(
      "404 Error: User attempted to access non-existent route:",
      pathname
    );
  }, [pathname]);
  return null;
}
