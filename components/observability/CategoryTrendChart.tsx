'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TimeWindowTabs } from './TimeWindowTabs'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { ChartDatasets, TimeWindow } from '@/lib/observability/types'
import type { EventCategory } from '@/lib/database.types'

interface CategoryTrendChartProps {
  datasets: ChartDatasets
}

const CATEGORY_COLORS: Record<string, string> = {
  bug: '#f87171',
  auth_oauth: '#fb923c',
  app_store: '#facc15',
  product_decision: '#34d399',
  roadmap: '#60a5fa',
  competitor_insight: '#a78bfa',
  pricing: '#f472b6',
  beta_feedback: '#2dd4bf',
  launch_blocker: '#ef4444',
  performance: '#fbbf24',
  security: '#f97316',
  feature_request: '#818cf8',
}

export function CategoryTrendChart({ datasets }: CategoryTrendChartProps) {
  const [window, setWindow] = useState<TimeWindow>('30d')
  const data = datasets.category[window]
  const categories = datasets.activeCategories

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Category Trends</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Top categories over time</p>
        </div>
        <TimeWindowTabs defaultWindow="30d" onChange={setWindow} />
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
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
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px', color: '#cbd5e1' }}
            formatter={(value: string) =>
              CATEGORY_LABELS[value as EventCategory] ?? value
            }
          />
          {categories.map((cat) => (
            <Line
              key={cat}
              type="monotone"
              dataKey={cat}
              stroke={CATEGORY_COLORS[cat] ?? '#94a3b8'}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3 }}
              name={cat}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
