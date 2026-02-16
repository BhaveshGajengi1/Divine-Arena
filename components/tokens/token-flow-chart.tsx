"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { EconomySnapshot } from "@/lib/types"

interface TokenFlowChartProps {
  data: EconomySnapshot[]
}

export function TokenFlowChart({ data }: TokenFlowChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-muted-foreground/40 italic">
        No economy data yet. Run simulation ticks.
      </div>
    )
  }

  const chartData = data.map((d) => ({
    tick: d.tick,
    wagered: d.totalWagered,
    transferred: d.totalTransferred,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <XAxis
          dataKey="tick"
          tick={{ fontSize: 10, fill: "hsl(260 12% 60%)" }}
          axisLine={{ stroke: "hsl(260 20% 18%)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "hsl(260 12% 60%)" }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(256 25% 10%)",
            border: "1px solid hsl(260 20% 18%)",
            borderRadius: "8px",
            fontSize: "11px",
          }}
        />
        <Bar dataKey="wagered" fill="hsl(43 55% 53%)" radius={[3, 3, 0, 0]} name="Wagered" />
        <Bar dataKey="transferred" fill="hsl(220 30% 54%)" radius={[3, 3, 0, 0]} name="Transferred" />
      </BarChart>
    </ResponsiveContainer>
  )
}
