"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle, Zap } from "lucide-react";
import Link from "next/link";
import type { UserCredits } from "@/lib/credits";

interface ProtocolFormProps {
  onSuccess?: (id: string) => void;
}

export function ProtocolForm({ onSuccess }: ProtocolFormProps) {
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [formData, setFormData] = useState({
    supplier_name: "",
    supplier_vat_id: "",
    creation_date: new Date().toISOString().split("T")[0],
    tax_event_date: new Date().toISOString().split("T")[0],
    reference_number: "",
    protocol_type: "standard" as "standard" | "commission",
    tax_rate: 20,
    linked_protocol_number: "",
  });

  const supabase = createClient();

  useEffect(() => {
    async function fetchCredits() {
      try {
        const res = await fetch("/api/credits");
        if (res.ok) setCredits(await res.json());
      } catch {
        // allow form on error
      } finally {
        setCreditsLoading(false);
      }
    }
    fetchCredits();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Re-check subscription before submit
    try {
      const res = await fetch("/api/credits");
      if (res.ok) {
        const latest: UserCredits = await res.json();
        if (!latest.isUnlimited) {
          toast.error("Нямате активен абонамент. Започнете безплатен тест.");
          setCredits(latest);
          setLoading(false);
          return;
        }
      }
    } catch {
      // proceed on error
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Не сте влезли в системата");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("protocols")
      .insert({
        supplier_name: formData.supplier_name,
        supplier_vat_id: formData.supplier_vat_id,
        creation_date: formData.creation_date,
        tax_event_date: formData.tax_event_date,
        reference_number: formData.reference_number || null,
        protocol_type: formData.protocol_type,
        tax_rate: formData.tax_rate,
        linked_protocol_number: formData.linked_protocol_number
          ? parseInt(formData.linked_protocol_number)
          : null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error("Грешка при създаване на протокол: " + error.message);
    } else {
      toast.success(
        `Протокол №${data.protocol_number} е създаден успешно`
      );
      onSuccess?.(data.id);
    }

    setLoading(false);
  };

  if (creditsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (credits && !credits.isUnlimited) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
              <Zap className="h-8 w-8 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Започнете безплатен тест</h3>
              <p className="text-sm text-muted-foreground mt-1">
                За да създавате протоколи, започнете 7-дневен безплатен тестов период.
                Не ви таксуваме през първите 7 дни.
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-8 py-3 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
            >
              <Zap className="h-4 w-4" />
              Започни 7-дневен безплатен тест
            </Link>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Съществуващите протоколи и фактури остават достъпни
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Данни на протокола</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="supplier_name">Име на доставчика</Label>
              <Input
                id="supplier_name"
                value={formData.supplier_name}
                onChange={(e) =>
                  setFormData({ ...formData, supplier_name: e.target.value })
                }
                placeholder="напр. СМ ТРАВЕЛ ООД"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_vat_id">ЕИК / ДДС номер</Label>
              <Input
                id="supplier_vat_id"
                value={formData.supplier_vat_id}
                onChange={(e) =>
                  setFormData({ ...formData, supplier_vat_id: e.target.value })
                }
                placeholder="напр. BG 204258128"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="creation_date">Дата на съставяне</Label>
              <Input
                id="creation_date"
                type="date"
                value={formData.creation_date}
                onChange={(e) =>
                  setFormData({ ...formData, creation_date: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_event_date">Дата на данъчно събитие</Label>
              <Input
                id="tax_event_date"
                type="date"
                value={formData.tax_event_date}
                onChange={(e) =>
                  setFormData({ ...formData, tax_event_date: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="protocol_type">Тип протокол</Label>
              <Select
                value={formData.protocol_type}
                onValueChange={(value: "standard" | "commission") =>
                  setFormData({ ...formData, protocol_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Стандартен</SelectItem>
                  <SelectItem value="commission">Комисионен</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_rate">Данъчна ставка (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                value={formData.tax_rate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tax_rate: parseFloat(e.target.value),
                  })
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reference_number">
                Референция № (незадължително)
              </Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reference_number: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linked_protocol_number">
                Към протокол № (коригиращ, незадължително)
              </Label>
              <Input
                id="linked_protocol_number"
                type="number"
                value={formData.linked_protocol_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    linked_protocol_number: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Създаване..." : "Създай протокол"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
