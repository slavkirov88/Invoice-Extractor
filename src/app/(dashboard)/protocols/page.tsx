export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { ProtocolList } from "@/components/protocols/ProtocolList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ProtocolsPage() {
  const supabase = await createClient();

  const { data: protocols, error } = await supabase
    .from("protocols")
    .select("*, invoices(id, section, amount)")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="text-destructive">Грешка: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Протоколи</h1>
          <p className="text-muted-foreground">
            Управление на протоколи по ЗДДС
          </p>
        </div>
        <Button asChild>
          <Link href="/protocols/new">
            <Plus className="mr-2 h-4 w-4" />
            Нов протокол
          </Link>
        </Button>
      </div>

      <ProtocolList protocols={protocols || []} />
    </div>
  );
}
