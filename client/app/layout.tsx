import "./globals.css";
import Providers from "./providers";
import NavVisibility from "@/components/NavVisibility";

export const metadata = {
  title: "Hex-Port",
  description: "Global marketplace for African exports",
  icons: "/favicon.ico",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <NavVisibility>{children}</NavVisibility>
        </Providers>
      </body>
    </html>
  );
}
