import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/api";
import { hexToHslTriple } from "@/lib/color";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${settings.storeName} — Catálogo de Celulares`,
      template: `%s | ${settings.storeName}`,
    },
    description: `Catálogo de celulares ${settings.storeName}: iPhone, Xiaomi, Samsung e Motorola com os melhores preços e parcelamento.`,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: settings.storeName,
      images: settings.bannerUrl ? [{ url: settings.bannerUrl }] : undefined,
    },
    icons: settings.logoUrl ? { icon: settings.logoUrl } : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const primaryHsl = hexToHslTriple(settings.primaryColor);

  return (
    <html lang="pt-BR" className={inter.variable} style={{ "--primary": primaryHsl, "--ring": primaryHsl } as React.CSSProperties}>
      <body className={cn("flex min-h-screen flex-col font-sans")}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
