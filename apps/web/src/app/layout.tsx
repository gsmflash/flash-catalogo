import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Flash Cell — Catálogo de Celulares",
    template: "%s | Flash Cell",
  },
  description: "Catálogo de celulares Flash Cell: iPhone, Xiaomi, Samsung e Motorola com os melhores preços e parcelamento.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
