"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface EditableImage {
  id: string;
  url: string;
  key: string;
  isMain: boolean;
}

interface SortableImageProps {
  image: EditableImage;
  onRemove: () => void;
  onSetMain: () => void;
}

export function SortableImage({ image, onRemove, onSetMain }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl border-2 bg-secondary",
        image.isMain ? "border-primary" : "border-transparent",
        isDragging && "z-10 opacity-70"
      )}
    >
      <Image src={image.url} alt="" fill sizes="150px" className="object-cover" />

      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1 rounded bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Arrastar para reordenar"
      >
        <GripVertical className="size-4" />
      </button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="absolute right-1 top-1 size-6 bg-black/50 text-white opacity-0 hover:bg-black/70 hover:text-white group-hover:opacity-100"
        aria-label="Remover imagem"
      >
        <X className="size-3.5" />
      </Button>

      <Button
        type="button"
        variant={image.isMain ? "default" : "secondary"}
        size="sm"
        onClick={onSetMain}
        className="absolute bottom-1 left-1 right-1 h-6 gap-1 text-xs opacity-0 group-hover:opacity-100"
      >
        <Star className="size-3" /> {image.isMain ? "Principal" : "Tornar principal"}
      </Button>
    </div>
  );
}
