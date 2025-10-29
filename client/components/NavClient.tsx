"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";

export default function NavClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // render nothing (or a skeleton) on server & first client render
  if (!mounted) return null;

  return <Navigation />;
}
