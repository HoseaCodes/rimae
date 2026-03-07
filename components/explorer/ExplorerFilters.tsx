'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X, SlidersHorizontal, Sparkles } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  CATEGORY_OPTIONS,
  SEVERITY_OPTIONS,
  STATUS_OPTIONS,
  SOURCE_TYPE_OPTIONS,
  CATEGORY_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
  SOURCE_TYPE_LABELS,
} from '@/lib/constants'
import type { EventCategory, EventSeverity, EventStatus, SourceType } from '@/lib/database.types'

interface ActiveView {
  id: string
  name: string
}

interface ExplorerFiltersProps {
  initialSearch: string
  initialCategory: string
  initialSeverity: string
  initialStatus: string
  initialSourceType: string
  initialDateFrom: string
  initialDateTo: string
  initialTag: string
  initialSort: string
  initialDir: string
  initialMode: string
  activeView?: ActiveView
}

const SORT_OPTIONS = [
  { value: 'event_timestamp|desc', label: 'Newest first' },
  { value: 'event_timestamp|asc', label: 'Oldest first' },
  { value: 'updated_at|desc', label: 'Recently updated' },
]

export function ExplorerFilters({
  initialSearch,
  initialCategory,
  initialSeverity,
  initialStatus,
  initialSourceType,
  initialDateFrom,
  initialDateTo,
  initialTag,
  initialSort,
  initialDir,
  initialMode,
  activeView,
}: ExplorerFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchValue, setSearchValue] = useState(initialSearch)
  const currentSort = `${initialSort}|${initialDir}`

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('view')
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchValue.trim()
      const current = searchParams.get('q') ?? ''
      if (trimmed !== current) {
        updateParams({ q: trimmed || null })
      }
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  useEffect(() => {
    setSearchValue(searchParams.get('q') ?? '')
  }, [searchParams])

  const handleClearAll = () => {
    router.push(pathname)
    setSearchValue('')
  }

  const handleSortChange = (value: string) => {
    const [sort, dir] = value.split('|')
    updateParams({ sort, dir })
  }

  const activeFilters: { key: string; label: string }[] = []
  if (initialSearch) activeFilters.push({ key: 'q', label: `"${initialSearch}"` })
  if (initialCategory) activeFilters.push({ key: 'category', label: CATEGORY_LABELS[initialCategory as EventCategory] ?? initialCategory })
  if (initialSeverity) activeFilters.push({ key: 'severity', label: SEVERITY_LABELS[initialSeverity as EventSeverity] ?? initialSeverity })
  if (initialStatus) activeFilters.push({ key: 'status', label: STATUS_LABELS[initialStatus as EventStatus] ?? initialStatus })
  if (initialSourceType) activeFilters.push({ key: 'source_type', label: SOURCE_TYPE_LABELS[initialSourceType as SourceType] ?? initialSourceType })
  if (initialTag) activeFilters.push({ key: 'tag', label: `#${initialTag}` })
  if (initialDateFrom) activeFilters.push({ key: 'date_from', label: `From ${initialDateFrom}` })
  if (initialDateTo) activeFilters.push({ key: 'date_to', label: `To ${initialDateTo}` })

  return (
    <div data-testid="explorer-filters" className="space-y-2">
      {activeView && (
        <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5">
          <span className="text-xs font-medium text-primary">
            Saved View: {activeView.name}
          </span>
          <button
            onClick={handleClearAll}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Clear view
          </button>
        </div>
      )}

      {/* Row 1: Search + primary filters + sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="search-input"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={initialMode === 'semantic' ? 'Describe what you\'re looking for…' : 'Search events…'}
            className="h-8 pl-8 text-xs"
          />
          {searchValue && (
            <button
              onClick={() => { setSearchValue(''); updateParams({ q: null }) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <button
          title={initialMode === 'semantic' ? 'Semantic search (click for keyword)' : 'Keyword search (click for semantic)'}
          onClick={() => updateParams({ mode: initialMode === 'semantic' ? null : 'semantic' })}
          className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${
            initialMode === 'semantic'
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border bg-transparent text-muted-foreground hover:bg-muted'
          }`}
        >
          <Sparkles size={11} />
          {initialMode === 'semantic' ? 'Semantic' : 'Keyword'}
        </button>

        <Select value={initialCategory || 'all'} onValueChange={(val) => updateParams({ category: val === 'all' ? null : val })}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={initialSeverity || 'all'} onValueChange={(val) => updateParams({ severity: val === 'all' ? null : val })}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            {SEVERITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={initialStatus || 'all'} onValueChange={(val) => updateParams({ status: val === 'all' ? null : val })}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-5 w-px bg-border" />

        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SlidersHorizontal size={12} className="mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(activeFilters.length > 0 || activeView) && (
          <button onClick={handleClearAll} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Row 2: Secondary filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={initialSourceType || 'all'} onValueChange={(val) => updateParams({ source_type: val === 'all' ? null : val })}>
          <SelectTrigger className="h-7 w-36 text-xs">
            <SelectValue placeholder="Source type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {SOURCE_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">From</span>
          <Input
            type="date"
            value={initialDateFrom}
            onChange={(e) => updateParams({ date_from: e.target.value || null })}
            className="h-7 w-36 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">To</span>
          <Input
            type="date"
            value={initialDateTo}
            onChange={(e) => updateParams({ date_to: e.target.value || null })}
            className="h-7 w-36 text-xs"
          />
        </div>

        {initialTag && (
          <div className="flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-xs">
            <span className="text-muted-foreground">Tag:</span>
            <span className="font-medium text-foreground">{initialTag}</span>
            <button onClick={() => updateParams({ tag: null })} className="ml-1 text-muted-foreground hover:text-foreground">
              <X size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground/60">Active:</span>
          {activeFilters.map(({ key, label }) => (
            <FilterChip
              key={key}
              label={label}
              onRemove={() => {
                if (key === 'q') { setSearchValue('') }
                updateParams({ [key]: null })
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-xs text-foreground/80 hover:bg-muted/60 hover:text-foreground"
    >
      {label}
      <X size={10} className="opacity-60" />
    </button>
  )
}
