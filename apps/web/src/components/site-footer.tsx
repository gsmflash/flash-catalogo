import Link from "next/link";
import { Instagram, Facebook, MapPin } from "lucide-react";
import type { StoreSettings } from "@/types";

export function SiteFooter({ settings }: { settings: StoreSettings }) {
  return (
    <footer className="border-t border-border/60 bg-secondary/30">
      <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-bold">{settings.storeName}</p>
          {settings.address && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" /> {settings.address}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {settings.instagram && (
            <Link
              href={settings.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-primary"
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
              className="text-muted-foreground transition-colors hover:text-primary"
              aria-label="Facebook"
            >
              <Facebook className="size-5" />
            </Link>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {settings.storeName}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
