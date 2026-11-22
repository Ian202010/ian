import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `${site.name} | Lavado de carros a domicilio en el área metro`,
  description:
    "Lavado de carros a domicilio en San Juan, Bayamón, Carolina, Guaynabo y el área metro de Puerto Rico. Limpieza por dentro y por fuera. Agenda tu cita.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-PR">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
