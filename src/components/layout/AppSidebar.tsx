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
    title: "Имейли",
    href: "/email",
    icon: Inbox,
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
                Добави фактура
              </Link>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-4 space-y-3">
        {/* Subscription widget */}
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
              <Link
                href="/settings"
                className="flex items-center justify-center gap-1.5 rounded-md bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700 transition-colors"
              >
                <Zap className="h-3 w-3" />
                Започни безплатен тест
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
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="mailto:support@travelinvoices.com">
                <Mail className="h-4 w-4" />
                <span>Поддръжка</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
