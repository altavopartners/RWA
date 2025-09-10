"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent SSR mismatch: only apply theme provider after mount
  if (!mounted) return <>{children}</>;

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
