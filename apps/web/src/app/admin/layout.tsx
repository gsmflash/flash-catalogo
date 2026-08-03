import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { getSettings } from "@/lib/api";
import { hexToHslTriple } from "@/lib/color";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Painel Administrativo",
    template: "%s | Flash Cell Admin",
  },
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings().catch(() => null);
  const primaryHsl = hexToHslTriple(settings?.primaryColor ?? "#D4AF37");

  return (
    <html lang="pt-BR" className={inter.variable} style={{ "--primary": primaryHsl, "--ring": primaryHsl } as React.CSSProperties}>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
