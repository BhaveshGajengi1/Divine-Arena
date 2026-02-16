"use client"

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import type { SentimentMetrics } from "@/lib/types"

interface SentimentChartProps {
  data: SentimentMetrics[]
}

export function SentimentChart({ data }: SentimentChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-muted-foreground/40 italic">
        No sentiment data yet. Run simulation ticks.
      </div>
    )
  }

  const chartData = data.map((d) => ({
    tick: d.tick,
    sentiment: Math.round(d.sentimentScore * 10) / 10,
    demand: d.demandIndex,
    velocity: d.velocity,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <XAxis
          dataKey="tick"
          tick={{ fontSize: 10, fill: "hsl(260 12% 60%)" }}
          axisLine={{ stroke: "hsl(260 20% 18%)" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: "hsl(260 12% 60%)" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <ReferenceLine y={50} stroke="hsl(260 20% 18%)" strokeDasharray="3 3" />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(256 25% 10%)",
            border: "1px solid hsl(260 20% 18%)",
            borderRadius: "8px",
            fontSize: "11px",
          }}
          labelStyle={{ color: "hsl(40 30% 90%)" }}
        />
        <Line
          type="monotone"
          dataKey="sentiment"
          stroke="hsl(43 55% 53%)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "hsl(47 75% 59%)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
