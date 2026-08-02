import { WhatsAppButton } from "@/components/whatsapp-button";

interface StickyWhatsAppProps {
  phone: string;
  brand: string;
  model: string;
  storage: string;
  price: string;
}

export function StickyWhatsApp({ phone, brand, model, storage, price }: StickyWhatsAppProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
      <div className="container flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[11px] text-muted-foreground">à vista no Pix</p>
          <p className="text-lg font-bold text-primary">{price}</p>
        </div>
        <WhatsAppButton phone={phone} brand={brand} model={model} storage={storage} size="lg" className="flex-1" />
      </div>
    </div>
  );
}
