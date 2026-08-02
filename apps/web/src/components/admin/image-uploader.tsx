"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud, Loader2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { SortableImage, type EditableImage } from "@/components/admin/sortable-image";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  images: EditableImage[];
  onChange: (images: EditableImage[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function uploadFiles(files: FileList | File[]) {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("images", file));

    setUploading(true);
    try {
      const res = await adminFetch<{ images: Array<{ key: string; url: string }> }>("/uploads", {
        method: "POST",
        body: formData,
      });
      const newImages: EditableImage[] = res.images.map((img, index) => ({
        id: img.key,
        url: img.url,
        key: img.key,
        isMain: images.length === 0 && index === 0,
      }));
      onChange([...images, ...newImages]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(image: EditableImage) {
    const remaining = images.filter((img) => img.id !== image.id);
    if (image.isMain && remaining.length > 0) remaining[0].isMain = true;
    onChange(remaining);
    adminFetch("/uploads", { method: "DELETE", body: { key: image.key } }).catch(() => {
      // best-effort cleanup; the reference is already removed from the product either way
    });
  }

  function handleSetMain(image: EditableImage) {
    onChange(images.map((img) => ({ ...img, isMain: img.id === image.id })));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    onChange(arrayMove(images, oldIndex, newIndex));
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
        )}
      >
        {uploading ? <Loader2 className="size-6 animate-spin text-muted-foreground" /> : <UploadCloud className="size-6 text-muted-foreground" />}
        <p className="text-sm text-muted-foreground">Arraste imagens aqui ou clique para selecionar</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {images.map((image) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  onRemove={() => handleRemove(image)}
                  onSetMain={() => handleSetMain(image)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
