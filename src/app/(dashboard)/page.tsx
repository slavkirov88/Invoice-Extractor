export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Receipt, TrendingUp, Calculator } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { count: protocolCount } = await supabase
    .from("protocols")
    .select("*", { count: "exact", head: true });

  const { count: invoiceCount } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true });

  const { data: invoices } = await supabase
    .from("invoices")
    .select("amount, section");

  const totalReceived =
    invoices
      ?.filter((i) => i.section === "A")
      .reduce((sum, i) => sum + Number(i.amount), 0) || 0;

  const totalPaid =
    invoices
      ?.filter((i) => i.section === "B")
      .reduce((sum, i) => sum + Number(i.amount), 0) || 0;

  const stats = [
    {
      title: "Протоколи",
      value: protocolCount || 0,
      icon: FileText,
      description: "Общ брой протоколи",
    },
    {
      title: "Фактури",
      value: invoiceCount || 0,
      icon: Receipt,
      description: "Общ брой фактури",
    },
    {
      title: "Получени суми",
      value: `${totalReceived.toFixed(2)} лв.`,
      icon: TrendingUp,
      description: "Общо получени (Раздел А)",
    },
    {
      title: "Платени суми",
      value: `${totalPaid.toFixed(2)} лв.`,
      icon: Calculator,
      description: "Общо платени (Раздел Б)",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Обобщение на протоколи и фактури
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <CardDescription>{stat.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
