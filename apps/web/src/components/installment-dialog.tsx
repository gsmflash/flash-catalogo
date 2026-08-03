"use client";

import { Calculator } from "lucide-react";
import type { InstallmentOption } from "@flashcell/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InstallmentTable } from "@/components/installment-table";

interface InstallmentDialogProps {
  productName: string;
  pricing: InstallmentOption[];
  className?: string;
}

export function InstallmentDialog({ productName, pricing, className }: InstallmentDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="lg" className={className}>
          <Calculator className="size-4" /> Ver parcelamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="size-4 text-primary" /> Parcelamento
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{productName}</p>
        </DialogHeader>
        <InstallmentTable pricing={pricing} />
      </DialogContent>
    </Dialog>
  );
}
