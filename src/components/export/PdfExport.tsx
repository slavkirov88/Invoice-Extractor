"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import type { Protocol } from "@/types";

export function PdfExport({ protocol }: { protocol: Protocol }) {
  return (
    <Button variant="outline" asChild>
      <Link href={`/protocols/${protocol.id}/print`} target="_blank">
        <FileText className="mr-2 h-4 w-4" />
        PDF
      </Link>
    </Button>
  );
}
