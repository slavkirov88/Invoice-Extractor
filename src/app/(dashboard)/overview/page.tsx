export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getUserCredits } from "@/lib/credits";
import { getLocaleFromCookies, getDictionary } from "@/lib/i18n";
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
  BadgeCheck,
} from "lucide-react";
import { TrialCTA } from "@/components/dashboard/TrialCTA";
import { SuccessHandler } from "@/components/dashboard/SuccessHandler";
import { Suspense } from "react";

export default async function DashboardPage() {
  const locale = await getLocaleFromCookies();
  const t = getDictionary(locale);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count: protocolCount } = await supabase
    .from("protocols")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const { count: invoiceCount } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id);

  const { data: invoices } = await supabase
    .from("invoices")
    .select("amount, section")
    .eq("user_id", user!.id);

  const totalReceived =
    invoices
      ?.filter((i) => i.section === "A")
      .reduce((sum, i) => sum + Number(i.amount), 0) || 0;

  const totalPaid =
    invoices
      ?.filter((i) => i.section === "B")
      .reduce((sum, i) => sum + Number(i.amount), 0) || 0;

  const credits = user ? await getUserCredits(supabase, user.id, user.email ?? undefined) : null;

  const stats = [
    {
      title: t.overview.protocolsCard,
      value: protocolCount || 0,
      icon: FileText,
      description: t.overview.protocolsDescription,
    },
    {
      title: t.overview.invoicesCard,
      value: invoiceCount || 0,
      icon: Receipt,
      description: t.overview.invoicesDescription,
    },
    {
      title: t.overview.receivedCard,
      value: `${totalReceived.toFixed(2)} €`,
      icon: TrendingUp,
      description: t.overview.receivedDescription,
    },
    {
      title: t.overview.paidCard,
      value: `${totalPaid.toFixed(2)} €`,
      icon: Calculator,
      description: t.overview.paidDescription,
    },
  ];

  return (
    <div className="space-y-6">
      <Suspense fallback={null}><SuccessHandler /></Suspense>
      <div>
        <h1 className="text-3xl font-bold">{t.overview.title}</h1>
        <p className="text-muted-foreground">
          {t.overview.subtitle}
        </p>
      </div>

      {/* Trial CTA or subscription badge */}
      {credits && !credits.hasSubscription && <TrialCTA />}

      {credits && credits.isUnlimited && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-8 w-8 text-green-400" />
              <div>
                <div className="font-semibold">
                  {credits.plan === "professional" ? t.plans.starter : credits.plan === "business" ? t.plans.business : t.plans.free} — {t.overview.unlimitedAccess}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t.overview.unlimitedNote}
                </div>
              </div>
            </div>
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
