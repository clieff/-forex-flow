"use client";

import { useState } from "react";
import { StockMovementForm } from "./stock-movement-form";

export function StockMovementFormWrapper() {
  const [lastMove, setLastMove] = useState<any>(null);

  return (
    <StockMovementForm 
      onCreated={(payload) => {
        setLastMove(payload);
      }} 
    />
  );
}
