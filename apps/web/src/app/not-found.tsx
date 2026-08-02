import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground">O produto ou página que você procura não existe ou foi removido.</p>
      <Button asChild>
        <Link href="/">Voltar ao catálogo</Link>
      </Button>
    </div>
  );
}
