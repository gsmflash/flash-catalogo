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
      <DialogContent className="flex max-w-md flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 gap-1 px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2 pr-6">
            <Calculator className="size-4 text-primary" /> Parcelamento
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{productName}</p>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <InstallmentTable pricing={pricing} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
