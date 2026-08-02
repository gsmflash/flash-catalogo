import { buildWhatsAppLink, buildWhatsAppMessage } from "@flashcell/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  phone: string;
  brand: string;
  model: string;
  storage: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  label?: string | null;
}

export function WhatsAppButton({
  phone,
  brand,
  model,
  storage,
  className,
  size = "default",
  label = "Comprar pelo WhatsApp",
}: WhatsAppButtonProps) {
  const href = buildWhatsAppLink(phone, buildWhatsAppMessage({ brand, model, storage }));

  return (
    <Button
      asChild
      size={size}
      className={cn("bg-[#25D366] text-white shadow-none hover:bg-[#1EBE5A] focus-visible:ring-[#25D366]", className)}
    >
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label ? undefined : "Comprar pelo WhatsApp"}>
        <MessageCircle className="size-4" />
        {label}
      </a>
    </Button>
  );
}
