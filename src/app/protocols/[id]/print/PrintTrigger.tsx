"use client";

import { useEffect } from "react";

export default function PrintTrigger() {
  useEffect(() => {
    // Small delay to ensure fonts are loaded before printing
    const timer = setTimeout(() => window.print(), 800);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
