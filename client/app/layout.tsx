// app/layout.tsx
import NavClient from "@/components/NavClient";
import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Hex-Port",
  description: "Global marketplace for African exports",
  icons: "/favicon.ico",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Providers is a client component */}
        <Providers>
          <NavClient />
          <main className="pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
