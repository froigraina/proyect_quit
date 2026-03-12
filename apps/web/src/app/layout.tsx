import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/features/auth/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pucho",
  description: "Aplicacion personal para dejar de fumar y medir progreso real."
};

export const viewport: Viewport = {
  themeColor: "#09090b"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
