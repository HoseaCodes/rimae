'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TimeWindowTabs } from './TimeWindowTabs'
import type { ChartDatasets, TimeWindow } from '@/lib/observability/types'

interface IssueFrequencyChartProps {
  datasets: ChartDatasets
}

export function IssueFrequencyChart({ datasets }: IssueFrequencyChartProps) {
  const [window, setWindow] = useState<TimeWindow>('30d')
  const data = datasets.frequency[window]

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Issue Frequency</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Events logged per day</p>
        </div>
        <TimeWindowTabs defaultWindow="30d" onChange={setWindow} />
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
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
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'hsl(var(--foreground))',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4, radius: 4 }}
            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 2 }}
            itemStyle={{ color: '#60a5fa' }}
          />
          <Bar dataKey="count" fill="#60a5fa" radius={[3, 3, 0, 0]} name="Events" maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
