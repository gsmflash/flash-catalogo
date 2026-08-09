"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { PRODUCT_STATUSES, PRODUCT_STATUS_LABELS, productSchema } from "@flashcell/shared";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/image-uploader";
import type { EditableImage } from "@/components/admin/sortable-image";
import type { AdminProduct, Category, PaymentMachine } from "@/types";

interface ProductFormProps {
  initialProduct?: AdminProduct;
}

interface SpecRow {
  id: string;
  key: string;
  value: string;
}

export function ProductForm({ initialProduct }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialProduct);

  const [categories, setCategories] = useState<Category[]>([]);
  const [machines, setMachines] = useState<PaymentMachine[]>([]);

  const [brand, setBrand] = useState(initialProduct?.brand ?? "");
  const [model, setModel] = useState(initialProduct?.model ?? "");
  const [color, setColor] = useState(initialProduct?.color ?? "");
  const [storage, setStorage] = useState(initialProduct?.storage ?? "");
  const [categoryId, setCategoryId] = useState(initialProduct?.categoryId ?? "");
  const [price, setPrice] = useState(initialProduct?.price ?? "");
  const [pricePix, setPricePix] = useState(initialProduct?.pricePix ?? "");
  const [description, setDescription] = useState(initialProduct?.description ?? "");
  const [status, setStatus] = useState(initialProduct?.status ?? "disponivel");
  const [machineId, setMachineId] = useState(initialProduct?.machineId ?? "");
  const [images, setImages] = useState<EditableImage[]>(
    (initialProduct?.images ?? []).map((img) => ({ id: img.id, url: img.url, key: img.key, isMain: img.isMain }))
  );
  const [specs, setSpecs] = useState<SpecRow[]>(
    Object.entries(initialProduct?.specifications ?? {}).map(([key, value], index) => ({
      id: `${index}-${key}`,
      key,
      value,
    }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    adminFetch<Category[]>("/categories").then(setCategories).catch(() => setCategories([]));
    adminFetch<PaymentMachine[]>("/payments/machines").then((data) => {
      setMachines(data);
      if (!machineId && data.length > 0) setMachineId(data[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addSpecRow() {
    setSpecs((prev) => [...prev, { id: crypto.randomUUID(), key: "", value: "" }]);
  }

  function updateSpecRow(id: string, field: "key" | "value", value: string) {
    setSpecs((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  function removeSpecRow(id: string) {
    setSpecs((prev) => prev.filter((row) => row.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const specifications = Object.fromEntries(
      specs.filter((row) => row.key.trim().length > 0).map((row) => [row.key.trim(), row.value])
    );

    const payload = {
      brand,
      model,
      color,
      storage,
      categoryId,
      price: Number(price),
      pricePix: Number(pricePix),
      description,
      specifications,
      status,
      machineId,
      images: images.map((img, index) => ({
        url: img.url,
        key: img.key,
        sortOrder: index,
        isMain: img.isMain,
      })),
    };

    const parsed = productSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Verifique os campos destacados");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && initialProduct) {
        await adminFetch(`/products/${initialProduct.id}`, { method: "PUT", body: parsed.data });
        toast.success("Produto atualizado");
      } else {
        await adminFetch("/products", { method: "POST", body: parsed.data });
        toast.success("Produto cadastrado");
      }
      router.push("/admin/produtos");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar produto");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} required />
          {errors.brand && <p className="text-xs text-destructive">{errors.brand}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} required />
          {errors.model && <p className="text-xs text-destructive">{errors.model}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Cor</Label>
          <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="storage">Memória</Label>
          <Input id="storage" placeholder="Ex: 128GB" value={storage} onChange={(e) => setStorage(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={categoryId} onValueChange={setCategoryId} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId}</p>}
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {PRODUCT_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Preço (base para cálculo das parcelas)</Label>
          <Input id="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
          {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="pricePix">Preço Pix</Label>
          <Input id="pricePix" type="number" step="0.01" min="0" value={pricePix} onChange={(e) => setPricePix(e.target.value)} required />
          {errors.pricePix && <p className="text-xs text-destructive">{errors.pricePix}</p>}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Máquina de cartão</Label>
          <Select value={machineId} onValueChange={setMachineId} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a máquina" />
            </SelectTrigger>
            <SelectContent>
              {machines.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">As parcelas são calculadas automaticamente a partir das taxas cadastradas em Operadoras.</p>
        </div>
      </section>

      <section className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Especificações</Label>
          <Button type="button" variant="outline" size="sm" onClick={addSpecRow}>
            <Plus className="size-4" /> Adicionar
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {specs.map((row) => (
            <div key={row.id} className="flex gap-2">
              <Input placeholder="Ex: Tela" value={row.key} onChange={(e) => updateSpecRow(row.id, "key", e.target.value)} />
              <Input placeholder="Ex: 6.1 polegadas" value={row.value} onChange={(e) => updateSpecRow(row.id, "value", e.target.value)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeSpecRow(row.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <Label>Imagens</Label>
        <ImageUploader images={images} onChange={setImages} />
      </section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/produtos")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Salvar alterações" : "Cadastrar produto"}
        </Button>
      </div>
    </form>
  );
}
