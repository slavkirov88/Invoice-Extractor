"use client";

import { useRouter } from "next/navigation";
import { ProtocolForm } from "@/components/protocols/ProtocolForm";
import { useLocale } from "@/lib/i18n/context";

export default function NewProtocolPage() {
  const router = useRouter();
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.protocols.newProtocol}</h1>
        <p className="text-muted-foreground">
          {t.protocols.newProtocolSubtitle}
        </p>
      </div>

      <ProtocolForm
        onSuccess={(id) => router.push(`/protocols/${id}`)}
      />
    </div>
  );
}
