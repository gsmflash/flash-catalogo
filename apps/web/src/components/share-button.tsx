"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({ title, text }: { title: string; text: string }) {
  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // user cancelled the native share sheet, nothing to do
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência");
  }

  return (
    <Button variant="outline" size="icon" onClick={handleShare} aria-label="Compartilhar produto">
      <Share2 className="size-4" />
    </Button>
  );
}
