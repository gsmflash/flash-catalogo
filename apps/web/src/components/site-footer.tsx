import Image from "next/image";
import Link from "next/link";
import { Instagram, Facebook, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { buildWhatsAppLink } from "@flashcell/shared";
import type { StoreSettings } from "@/types";

export function SiteFooter({ settings }: { settings: StoreSettings }) {
  const whatsappHref = buildWhatsAppLink(
    settings.whatsapp,
    "Olá! Vim pelo site da Flash Cell e gostaria de mais informações."
  );

  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="container grid grid-cols-1 gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            {settings.logoUrl ? (
              <Image src={settings.logoUrl} alt={settings.storeName} width={40} height={40} className="rounded-full" />
            ) : (
              <span className="flex size-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                {settings.storeName.charAt(0)}
              </span>
            )}
            <span className="text-lg font-semibold">{settings.storeName}</span>
          </div>
          <p className="max-w-xs text-sm text-white/60">
            Referência em smartphones novos e seminovos, com garantia e procedência.
          </p>
          <div className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" /> Garantia Flash Cell
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Contato</h3>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-primary">
            <MessageCircle className="size-4" /> WhatsApp
          </a>
          {settings.address && (
            <div className="flex items-start gap-2 text-sm text-white/80">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span>{settings.address}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Redes sociais</h3>
          <div className="flex items-center gap-3">
            {settings.instagram && (
              <Link
                href={settings.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-primary/40 hover:text-primary"
                aria-label="Instagram"
              >
                <Instagram className="size-5" />
              </Link>
            )}
            {settings.facebook && (
              <Link
                href={settings.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-primary/40 hover:text-primary"
                aria-label="Facebook"
              >
                <Facebook className="size-5" />
              </Link>
            )}
            {!settings.instagram && !settings.facebook && (
              <p className="text-sm text-white/40">Em breve nas redes sociais.</p>
            )}
          </div>
        </div>

        {settings.address && (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <iframe
              title="Localização Flash Cell"
              src={`https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`}
              className="h-40 w-full grayscale invert-[0.92] contrast-[1.1]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>

      <div className="border-t border-white/10 py-6">
        <div className="container flex flex-col items-center justify-between gap-2 text-xs text-white/40 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {settings.storeName}. Todos os direitos reservados.
          </p>
          <p>Feito com cuidado para quem exige o melhor.</p>
        </div>
      </div>
    </footer>
  );
}
