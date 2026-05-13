"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string;
  change: number;
  data: Array<{ value: number }>;
}

export function MetricCard({ label, value, change, data }: MetricCardProps) {
  const positive = change >= 0;

  return (
    <Card className="min-h-[220px] overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>{label}</CardTitle>
          <div
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
              positive ? "bg-forex-mint/10 text-forex-mint" : "bg-forex-danger/10 text-forex-danger"
            }`}
          >
            {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {positive ? "+" : ""}
            {change.toFixed(1)}%
          </div>
        </div>
        <p className="text-3xl font-semibold text-white">{value}</p>
      </CardHeader>
      <CardContent className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`metric-gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00C9A7" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#00B4D8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="#00C9A7"
              strokeWidth={2}
              fill={`url(#metric-gradient-${label})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
