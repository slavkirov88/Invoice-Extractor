"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Plus,
  Settings,
  Receipt,
  Shield,
  BadgeCheck,
  Zap,
  Mail,
  Inbox,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";
import type { UserCredits } from "@/lib/credits";
import { useLocale } from "@/lib/i18n/context";

const ADMIN_EMAIL = "slavkirov@abv.bg";

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState<UserCredits | null>(null);

  const navItems = [
    {
      title: t.sidebar.dashboard,
      href: "/overview",
      icon: LayoutDashboard,
    },
    {
      title: t.sidebar.protocols,
      href: "/protocols",
      icon: FileText,
    },
    {
      title: t.sidebar.emails,
      href: "/email",
      icon: Inbox,
    },
  ];

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAdmin(user?.email === ADMIN_EMAIL);

      // Fetch credits
      try {
        const res = await fetch("/api/credits");
        if (res.ok) {
          const data = await res.json();
          setCredits(data);
        }
      } catch {
        // silently fail
      }
    }
    init();
  }, []);

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border px-6 py-4">
        <Link href="/overview" className="flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">TravelInvoices</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.sidebar.navigation}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <div className="mt-3 px-2">
              <Link
                href="/invoices/add"
                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  pathname.startsWith("/invoices/add")
                    ? "bg-violet-700 text-white"
                    : "bg-violet-600 text-white hover:bg-violet-700"
                }`}
              >
                <Plus className="h-4 w-4" />
                {t.sidebar.addInvoice}
              </Link>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-4 space-y-3">
        {/* Subscription widget */}
        {credits && (
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            {credits.hasSubscription ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">
                    {credits.plan === "professional" ? t.plans.starter : credits.plan === "business" ? t.plans.business : t.plans.free}
                  </span>
                </div>
                {credits.subscriptionStatus === "trialing" && credits.currentPeriodEnd && (
                  <div className="text-xs text-muted-foreground">
                    {(() => {
                      const days = Math.max(0, Math.ceil((new Date(credits.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                      return (
                        <span className={days <= 3 ? "text-amber-400 font-medium" : ""}>
                          {days} {days === 1 ? t.common.day : t.common.days} {t.sidebar.trialDaysRemaining}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/settings"
                className="flex items-center justify-center gap-1.5 rounded-md bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700 transition-colors"
              >
                <Zap className="h-3 w-3" />
                {t.sidebar.startFreeTrial}
              </Link>
            )}
          </div>
        )}

        <SidebarMenu>
          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/admin")}
              >
                <Link href="/admin">
                  <Shield className="h-4 w-4" />
                  <span>{t.sidebar.admin}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/settings"}>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>{t.sidebar.settings}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="mailto:support@travelinvoices.com">
                <Mail className="h-4 w-4" />
                <span>{t.sidebar.support}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
