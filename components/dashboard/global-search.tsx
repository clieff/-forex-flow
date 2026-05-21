"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LoaderCircle, Receipt, User } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type SearchResult = {
  transactions: { id: string; receiptNumber: string; clientName: string; type: string; currencyCode: string; date: string }[];
  clients: { id: string; name: string; contact: string | null }[];
};

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ transactions: [], clients: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  useEffect(() => {
    if (query.length < 2) {
      setResults({ transactions: [], clients: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          setResults(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(url as any);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 bg-[#0A0F1A] border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b border-white/10">
          <Search className="h-5 w-5 text-forex-muted mr-3" />
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-forex-muted"
            placeholder="Rechercher un reçu, client, transaction..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <LoaderCircle className="h-4 w-4 text-forex-mint animate-spin" />}
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto">
          {query.length > 1 && results.transactions.length === 0 && results.clients.length === 0 && !loading && (
            <div className="p-8 text-center text-forex-muted">Aucun résultat trouvé pour "{query}"</div>
          )}

          {results.transactions.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold text-forex-muted uppercase tracking-wider">Transactions</p>
              {results.transactions.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => handleSelect(`/api/transaction/${tx.id}/receipt`)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-white/[0.04] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tx.type === "BUY" ? "bg-forex-mint/10 text-forex-mint" : "bg-forex-danger/10 text-forex-danger"}`}>
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{tx.receiptNumber}</p>
                      <p className="text-xs text-forex-muted">{tx.clientName} • {new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{tx.type} {tx.currencyCode}</span>
                </button>
              ))}
            </div>
          )}

          {results.clients.length > 0 && (
            <div className="p-2 border-t border-white/5">
              <p className="px-3 py-2 text-xs font-semibold text-forex-muted uppercase tracking-wider">Clients</p>
              {results.clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(`/transactions?q=${encodeURIComponent(c.name)}`)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.04] transition"
                >
                  <div className="p-2 rounded-lg bg-white/[0.05] text-white">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    {c.contact && <p className="text-xs text-forex-muted">{c.contact}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
