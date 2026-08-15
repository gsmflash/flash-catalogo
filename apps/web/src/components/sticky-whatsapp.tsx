import { WhatsAppButton } from "@/components/whatsapp-button";
import { PurchaseDialog } from "@/components/purchase-dialog";

interface StickyWhatsAppProps {
  phone: string;
  brand: string;
  model: string;
  storage: string;
  price: string;
  product: {
    id: string;
    brand: string;
    model: string;
    color: string;
    storage: string;
    price: string | number;
    imageUrl?: string | null;
  };
}

export function StickyWhatsApp({ phone, brand, model, storage, price, product }: StickyWhatsAppProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
      <div className="container flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[11px] text-muted-foreground">à vista no Pix</p>
          <p className="text-lg font-bold text-primary">{price}</p>
        </div>
        <WhatsAppButton phone={phone} brand={brand} model={model} storage={storage} size="icon" label={null} />
        <PurchaseDialog product={product} whatsapp={phone} triggerClassName="flex-1" triggerSize="lg" />
      </div>
    </div>
  );
}
