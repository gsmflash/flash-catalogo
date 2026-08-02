"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SingleImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  aspect?: "square" | "wide";
}

export function SingleImageUpload({ value, onChange, aspect = "square" }: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const formData = new FormData();
    formData.append("images", file);
    setUploading(true);
    try {
      const res = await adminFetch<{ images: Array<{ url: string }> }>("/uploads", { method: "POST", body: formData });
      onChange(res.images[0]?.url ?? null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      onClick={() => !value && inputRef.current?.click()}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-secondary/40",
        aspect === "square" ? "size-32" : "aspect-[21/6] w-full max-w-md",
        !value && "cursor-pointer hover:bg-secondary/60"
      )}
    >
      {uploading && <Loader2 className="size-6 animate-spin text-muted-foreground" />}
      {!uploading && value && (
        <>
          <Image src={value} alt="" fill className="object-cover" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 size-6 bg-black/50 text-white hover:bg-black/70 hover:text-white"
            onClick={() => onChange(null)}
          >
            <X className="size-3.5" />
          </Button>
        </>
      )}
      {!uploading && !value && (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <UploadCloud className="size-5" />
          <span className="text-xs">Enviar imagem</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
