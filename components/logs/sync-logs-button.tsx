"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SyncLogsButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSync() {
    if (!confirm("Voulez-vous reconstruire tout l'historique des logs à partir des transactions et mouvements existants ?")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/logs/reconstruct", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast.success("Synchronisation terminée", {
          description: `${data.count} entrées d'historique ont été reconstruites.`
        });
        router.refresh();
      } else {
        toast.error("Erreur de synchronisation");
      }
    } catch (error) {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleSync}
      disabled={loading}
      className="border-white/10 bg-white/[0.05] text-forex-muted hover:text-white"
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Synchronisation..." : "Synchroniser l'historique"}
    </Button>
  );
}
