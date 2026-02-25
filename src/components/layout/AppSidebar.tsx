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
  Sparkles,
  BadgeCheck,
  Zap,
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

const ADMIN_EMAIL = "slavkirov@abv.bg";

const navItems = [
  {
    title: "Dashboard",
    href: "/overview",
    icon: LayoutDashboard,
  },
  {
    title: "Протоколи",
    href: "/protocols",
    icon: FileText,
  },
  {
    title: "Добави фактура",
    href: "/invoices/add",
    icon: Plus,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState<UserCredits | null>(null);

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
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
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
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-4 space-y-3">
        {/* Credits widget */}
        {credits && (
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            {credits.isUnlimited ? (
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">
                  {credits.planName}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    Кредити
                  </span>
                  <span className="text-xs font-medium">
                    {credits.remaining}/{credits.total}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      credits.remaining === 0
                        ? "bg-red-500"
                        : credits.remaining <= 3
                          ? "bg-yellow-500"
                          : "bg-violet-500"
                    }`}
                    style={{
                      width: `${(credits.remaining / credits.total) * 100}%`,
                    }}
                  />
                </div>
                {credits.remaining === 0 ? (
                  <Link
                    href="/settings"
                    className="mt-2 flex items-center justify-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 transition-colors"
                  >
                    <Zap className="h-3 w-3" />
                    Upgrade
                  </Link>
                ) : (
                  <Link
                    href="/settings"
                    className="mt-2 flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Sparkles className="h-3 w-3" />
                    Upgrade за неограничен достъп
                  </Link>
                )}
              </>
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
                  <span>Админ</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/settings"}>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Настройки</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
