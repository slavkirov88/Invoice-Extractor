"use client";

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import type { Protocol } from "@/types";

export function PdfExport({ protocol }: { protocol: Protocol }) {
  const handleExport = () => {
    window.open(`/protocols/${protocol.id}/print`, "_blank");
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <FileText className="mr-2 h-4 w-4" />
      PDF
    </Button>
  );
}
