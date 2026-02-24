"use client";

import { useState } from "react";
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

interface ProtocolFormProps {
  onSuccess?: (id: string) => void;
}

export function ProtocolForm({ onSuccess }: ProtocolFormProps) {
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
                  <SelectItem value="commission">Комисионна</SelectItem>
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
