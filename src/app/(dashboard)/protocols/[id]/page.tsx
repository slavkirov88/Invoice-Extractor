export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProtocolDetail } from "@/components/protocols/ProtocolDetail";

export default async function ProtocolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: protocol, error } = await supabase
    .from("protocols")
    .select("*, invoices(*)")
    .eq("id", id)
    .single();

  if (error || !protocol) {
    notFound();
  }

  return <ProtocolDetail protocol={protocol} />;
}
