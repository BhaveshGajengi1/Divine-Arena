"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { Agent } from "@/lib/types"

interface DominanceChartProps {
  agents: Record<string, Agent>
}

export function DominanceChart({ agents }: DominanceChartProps) {
  const data = Object.values(agents)
    .filter((a) => a.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .map((a) => ({
      name: a.persona.name,
      value: a.balance,
      color: a.persona.color,
    }))

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-muted-foreground/40 italic">
        No token distribution data.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={75}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(256 25% 10%)",
            border: "1px solid hsl(260 20% 18%)",
            borderRadius: "8px",
            fontSize: "11px",
          }}
          formatter={(value: number, name: string) => [`${value} tokens`, name]}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
