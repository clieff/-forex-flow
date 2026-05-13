"use client";

import { useRouter } from "next/navigation";
import { StockMovementForm } from "./stock-movement-form";

export function StockMovementFormWrapper() {
  const router = useRouter();

  return (
    <StockMovementForm 
      onCreated={() => {
        router.refresh();
      }} 
    />
  );
}
