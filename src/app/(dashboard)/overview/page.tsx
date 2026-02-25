export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getUserCredits } from "@/lib/credits";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Receipt,
  TrendingUp,
  Calculator,
  Sparkles,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const credits = user ? await getUserCredits(supabase, user.id) : null;

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
        <h1 className="text-3xl font-bold">Табло</h1>
        <p className="text-muted-foreground">
          Преглед на вашата активност
        </p>
      </div>

      {/* Credits card */}
      {credits && (
        <Card
          className={
            credits.isUnlimited
              ? "border-green-500/30 bg-green-500/5"
              : credits.remaining === 0
                ? "border-red-500/30 bg-red-500/5"
                : "border-violet-500/30 bg-violet-500/5"
          }
        >
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              {credits.isUnlimited ? (
                <BadgeCheck className="h-8 w-8 text-green-400" />
              ) : (
                <Sparkles className="h-8 w-8 text-violet-400" />
              )}
              <div>
                <div className="font-semibold">
                  {credits.isUnlimited
                    ? `${credits.planName} — Неограничен достъп`
                    : `${credits.remaining} от ${credits.total} кредита остават`}
                </div>
                <div className="text-sm text-muted-foreground">
                  {credits.isUnlimited
                    ? "Създавайте неограничен брой протоколи"
                    : "Всеки нов протокол използва 1 кредит"}
                </div>
              </div>
            </div>
            {!credits.isUnlimited && (
              <Link
                href="/settings"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Upgrade
              </Link>
            )}
          </CardContent>
        </Card>
      )}

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
