'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TimeWindowTabs } from './TimeWindowTabs'
import type { ChartDatasets, TimeWindow } from '@/lib/observability/types'

interface SeverityTrendChartProps {
  datasets: ChartDatasets
}

const SEVERITY_COLORS = {
  critical: '#f87171',
  high: '#fb923c',
  medium: '#facc15',
  low: '#60a5fa',
  info: '#94a3b8',
}

export function SeverityTrendChart({ datasets }: SeverityTrendChartProps) {
  const [window, setWindow] = useState<TimeWindow>('30d')
  const data = datasets.severity[window]

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Severity Over Time</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Stacked by severity level</p>
        </div>
        <TimeWindowTabs defaultWindow="30d" onChange={setWindow} />
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
              <linearGradient key={sev} id={`grad-${sev}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#e2e8f0', fontWeight: 500 }}
            tickLine={false}
            axisLine={{ stroke: '#475569', strokeOpacity: 0.8 }}
            interval="preserveStartEnd"
            dy={6}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#e2e8f0', fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#f1f5f9',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 2 }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px', color: '#cbd5e1' }} />
          {(Object.keys(SEVERITY_COLORS) as (keyof typeof SEVERITY_COLORS)[]).map((sev) => (
            <Area
              key={sev}
              type="monotone"
              dataKey={sev}
              stackId="1"
              stroke={SEVERITY_COLORS[sev]}
              fill={`url(#grad-${sev})`}
              strokeWidth={1.5}
              dot={false}
              name={sev}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
