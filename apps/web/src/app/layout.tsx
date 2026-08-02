import type { Metadata } from "next";
import "./globals.css";
import { getCategories, getSettings } from "@/lib/api";
import { hexToHslTriple } from "@/lib/color";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";

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
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const primaryHsl = hexToHslTriple(settings.primaryColor);

  return (
    <html lang="pt-BR" style={{ "--primary": primaryHsl, "--ring": primaryHsl } as React.CSSProperties}>
      <body className="flex min-h-screen flex-col">
        <SiteHeader settings={settings} categories={categories} />
        <main className="flex-1">{children}</main>
        <SiteFooter settings={settings} />
        <Toaster />
      </body>
    </html>
  );
}
