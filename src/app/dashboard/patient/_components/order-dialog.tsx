"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type Medicine = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  pharmacy: string;
  image: string;
};

export function OrderDialog({
  medicine,
  open,
  onClose,
}: {
  medicine: Medicine | null;
  open: boolean;
  onClose: () => void;
}) {
  const [qty, setQty] = useState("1");
  const [delivery, setDelivery] = useState("collect");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  if (!medicine) return null;

  const place = () => {
    toast.success("Order placed", {
      description: `${qty}x ${medicine.name} — R${(medicine.price * Number(qty)).toFixed(2)}`,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-strong max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Order {medicine.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Price per unit</span>
            <span className="font-semibold">R{medicine.price.toFixed(2)}</span>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-medium">Quantity</Label>
            <Select value={qty} onValueChange={setQty}>
              <SelectTrigger className="input-premium h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-medium">Delivery method</Label>
            <Select value={delivery} onValueChange={setDelivery}>
              <SelectTrigger className="input-premium h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="collect">Collect at pharmacy</SelectItem>
                <SelectItem value="deliver">Home delivery (+R45)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {delivery === "deliver" && (
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Delivery address</Label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, city, postal code"
                className="input-premium min-h-[70px]"
              />
            </div>
          )}

          <div>
            <Label className="mb-1.5 block text-xs font-medium">Special instructions (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Allergies, dosage preferences, etc."
              className="input-premium min-h-[60px]"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-card/40 p-3">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-bold text-medical">
              R{(medicine.price * Number(qty) + (delivery === "deliver" ? 45 : 0)).toFixed(2)}
            </span>
          </div>

          <Button onClick={place} className="w-full rounded-xl">
            Place order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
