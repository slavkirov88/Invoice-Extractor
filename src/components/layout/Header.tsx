"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";

const routeLabels: Record<string, string> = {
  overview: "Табло",
  protocols: "Протоколи",
  new: "Нов протокол",
  invoices: "Фактури",
  add: "Добави фактура",
  settings: "Настройки",
  admin: "Админ",
};

function isUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function Header() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Skip "overview" to avoid "Табло > Табло"
  const displaySegments = segments.filter((s) => s !== "overview");

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/overview">Табло</BreadcrumbLink>
          </BreadcrumbItem>
          {displaySegments.map((segment, index) => {
            const segmentIndex = segments.indexOf(segment);
            const href = "/" + segments.slice(0, segmentIndex + 1).join("/");
            const isLast = index === displaySegments.length - 1;
            const label = isUUID(segment)
              ? "Детайли"
              : routeLabels[segment] || segment;

            return (
              <BreadcrumbItem key={href}>
                <BreadcrumbSeparator />
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
