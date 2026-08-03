import Link from "next/link";
import "./globals.css";
import { Button } from "@/components/ui/button";

export default function GlobalNotFound() {
  return (
    <html lang="pt-BR" className="dark">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center font-sans text-foreground">
        <h1 className="text-3xl font-bold">Página não encontrada</h1>
        <p className="text-muted-foreground">A página que você procura não existe ou foi removida.</p>
        <Button asChild>
          <Link href="/">Voltar ao catálogo</Link>
        </Button>
      </body>
    </html>
  );
}
