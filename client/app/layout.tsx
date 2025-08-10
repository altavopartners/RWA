// app/layout.tsx
import "./globals.css";
import Providers from "./providers";
import Navigation from "@/components/Navigation";

export const metadata = {
  title: "Hex-Port",
  description: "Global marketplace for African exports",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navigation />
          {/* Nav is h-16 (64px) → add matching top padding */}
          <main className="pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
