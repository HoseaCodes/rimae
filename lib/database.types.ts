export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── Postgres Enum types ───────────────────────────────────────────────────

export type SourceType =
  | 'chatgpt_web'
  | 'claude_web'
  | 'manual'
  | 'notion'
  | 'slack'
  | 'email'
  | 'document'
  | 'screenshot'
  | 'external_url'
  | 'other'

export type EventSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type EventStatus =
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'archived'
  | 'wont_fix'

export type EventCategory =
  | 'product_decision'
  | 'bug'
  | 'auth_oauth'
  | 'launch_blocker'
  | 'beta_feedback'
  | 'competitor_insight'
  | 'pricing'
  | 'roadmap'
  | 'app_store'
  | 'marketing'
  | 'chat_log'
  | 'general'

export type EventType =
  | 'decision'
  | 'bug_note'
  | 'feedback'
  | 'insight'
  | 'blocker'
  | 'update'
  | 'reference'
  | 'log'

// ─── Table row types ───────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Source {
  id: string
  project_id: string
  type: SourceType
  name: string
  original_url: string | null
  imported_at: string | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  project_id: string
  source_id: string | null
  title: string
  summary: string | null
  raw_text: string
  event_type: EventType
  category: EventCategory
  severity: EventSeverity
  status: EventStatus
  event_timestamp: string
  created_at: string
  updated_at: string
  search_vector: string | null
}

export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface EventTag {
  event_id: string
  tag_id: string
}

export interface SavedView {
  id: string
  project_id: string
  name: string
  description: string | null
  filter_state: Json
  created_at: string
  updated_at: string
}

// ─── View types (events_with_meta) ──────────────────────────────────────────

export interface EventWithMeta extends Event {
  source_name: string | null
  source_type: SourceType | null
  tag_names: string[]
}

// ─── Filter state (stored in saved_views.filter_state) ──────────────────────

export interface FilterState {
  search?: string
  category?: EventCategory | ''
  severity?: EventSeverity[]
  status?: EventStatus | ''
  source_type?: SourceType | ''
  tags?: string[]
  date_from?: string
  date_to?: string
  sort_by?: 'event_timestamp' | 'severity' | 'updated_at'
  sort_dir?: 'asc' | 'desc'
}

// ─── Database shape for Supabase JS client (v2) ───────────────────────────────
// Supabase v2 requires Row/Insert/Update/Relationships on each table.

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Project, 'id'>>
        Relationships: []
      }
      sources: {
        Row: Source
        Insert: Omit<Source, 'id' | 'created_at' | 'updated_at'> & { id?: string; type?: SourceType; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Source, 'id'>>
        Relationships: []
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'search_vector'> & {
          id?: string
          summary?: string | null
          source_id?: string | null
          event_type?: EventType
          category?: EventCategory
          severity?: EventSeverity
          status?: EventStatus
          event_timestamp?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Event, 'id' | 'search_vector'>>
        Relationships: []
      }
      tags: {
        Row: Tag
        Insert: Omit<Tag, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Tag, 'id'>>
        Relationships: []
      }
      event_tags: {
        Row: EventTag
        Insert: EventTag
        Update: Partial<EventTag>
        Relationships: []
      }
      saved_views: {
        Row: SavedView
        Insert: Omit<SavedView, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          description?: string | null
          filter_state?: Json
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<SavedView, 'id'>>
        Relationships: []
      }
    }
    Views: {
      events_with_meta: {
        Row: EventWithMeta
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: {
      source_type: SourceType
      event_severity: EventSeverity
      event_status: EventStatus
      event_category: EventCategory
      event_type: EventType
    }
    CompositeTypes: Record<string, never>
  }
}
