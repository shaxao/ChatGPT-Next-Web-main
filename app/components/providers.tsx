"use client";

import { ThemeProvider } from "@lobehub/ui";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider themeMode="auto" style={{ width: "100%", height: "100%" }}>
      {children}
    </ThemeProvider>
  );
}
