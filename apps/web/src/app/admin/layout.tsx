import { AuthProvider } from "@/contexts/auth-context";

export const metadata = {
  title: "Painel Administrativo",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
