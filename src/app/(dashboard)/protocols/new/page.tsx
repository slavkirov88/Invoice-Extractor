"use client";

import { useRouter } from "next/navigation";
import { ProtocolForm } from "@/components/protocols/ProtocolForm";

export default function NewProtocolPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Нов протокол</h1>
        <p className="text-muted-foreground">
          Създайте нов протокол по ЗДДС за обща туристическа услуга
        </p>
      </div>

      <ProtocolForm
        onSuccess={(id) => router.push(`/protocols/${id}`)}
      />
    </div>
  );
}
