export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getLocaleFromCookies, getDictionary } from "@/lib/i18n";
import { ProtocolList } from "@/components/protocols/ProtocolList";
import { MarginReportButton } from "@/components/protocols/MarginReportButton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ProtocolsPage() {
  const locale = await getLocaleFromCookies();
  const t = getDictionary(locale);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: protocols, error } = await supabase
    .from("protocols")
    .select("*, invoices(id, section, amount)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="text-destructive">{t.protocols.errorLoading}: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.protocols.title}</h1>
          <p className="text-muted-foreground">
            {t.protocols.subtitle}
          </p>
        </div>
        <div className="flex items-end gap-3">
          <MarginReportButton />
          <Button asChild>
            <Link href="/protocols/new">
              <Plus className="mr-2 h-4 w-4" />
              {t.protocols.newProtocol}
            </Link>
          </Button>
        </div>
      </div>

      <ProtocolList protocols={protocols || []} />
    </div>
  );
}
