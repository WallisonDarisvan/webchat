import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atendimento Exclusivo | Chat Oficial",
  description: "Fale com nosso consultor especialista em tempo real e tire suas dúvidas.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-[#0b141a] text-[#e9edef] min-h-screen selection:bg-emerald-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}

