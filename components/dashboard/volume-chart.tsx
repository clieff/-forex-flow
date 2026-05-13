"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompact } from "@/lib/formatters";

export function VolumeChart({
  data
}: {
  data: Array<{ day: string; buyVolume: number; sellVolume: number }>;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Flux d'achat vs vente - 7 derniers jours</CardTitle>
        <p className="text-sm text-forex-muted">
          Lecture instantanee des volumes en caisse pour ajuster les spreads avec precision.
        </p>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <defs>
              <linearGradient id="buyBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00C9A7" stopOpacity={1} />
                <stop offset="100%" stopColor="#00C9A7" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="sellBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00B4D8" stopOpacity={1} />
                <stop offset="100%" stopColor="#00B4D8" stopOpacity={0.25} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#8EA3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(value) => formatCompact(value)}
              tick={{ fill: "#8EA3B8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
              contentStyle={{
                background: "#101827",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 18,
                color: "#E6EEF8"
              }}
            />
            <Legend />
            <Bar dataKey="buyVolume" stackId="volume" fill="url(#buyBar)" radius={[10, 10, 0, 0]} name="Achats" />
            <Bar dataKey="sellVolume" stackId="volume" fill="url(#sellBar)" radius={[10, 10, 0, 0]} name="Ventes" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
