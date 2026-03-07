/**
 * Stable seed data constants derived from supabase/seed/001_seed_data.sql
 * These IDs are fixed — tests depend on them existing in the dev database.
 */

export const EVENTS = {
  oauthCookieBug: {
    id: 'd1000000-0000-0000-0000-000000000001',
    title: 'Selective cookie blocking breaks GitHub OAuth callback',
    category: 'auth_oauth',
    severity: 'high',
    status: 'in_progress',
  },
  loginCancelRetry: {
    id: 'd1000000-0000-0000-0000-000000000002',
    title: 'Login cancel and retry creates broken auth state',
    category: 'auth_oauth',
    severity: 'medium',
    status: 'open',
  },
  betaAuthFriction: {
    id: 'd1000000-0000-0000-0000-000000000003',
    title: 'Beta testers report confusing auth flow — 3 of 5 needed help',
    category: 'beta_feedback',
    severity: 'high',
    status: 'open',
  },
  pricingDecision: {
    id: 'd1000000-0000-0000-0000-000000000004',
    title: 'Pricing decision: 3-tier subscription model with solo dev free tier',
    category: 'pricing',
    severity: 'high',
    status: 'resolved',
  },
  launchBlocker: {
    id: 'd1000000-0000-0000-0000-000000000005',
    title: 'LAUNCH BLOCKER: Supabase Realtime drops connections on free plan',
    category: 'launch_blocker',
    severity: 'critical',
    status: 'open',
  },
  competitorInsight: {
    id: 'd1000000-0000-0000-0000-000000000006',
    title: "Competitor insight: Buildkite UI is dense but users praise \"information density\"",
    category: 'competitor_insight',
    severity: 'medium',
    status: 'resolved',
  },
  appStoreRejection: {
    id: 'd1000000-0000-0000-0000-000000000007',
    title: 'App Store rejection: missing privacy policy link on sign-in screen',
    category: 'app_store',
    severity: 'high',
    status: 'resolved',
  },
  pkceDecision: {
    id: 'd1000000-0000-0000-0000-000000000010',
    title: 'Auth decision: Adopt PKCE flow for all OAuth providers',
    category: 'auth_oauth',
    severity: 'high',
    status: 'resolved',
  },
} as const

export const VIEWS = {
  authAndOAuth: {
    id: 'e1000000-0000-0000-0000-000000000001',
    name: 'Auth & OAuth',
  },
  launchBlockers: {
    id: 'e1000000-0000-0000-0000-000000000002',
    name: 'Launch Blockers',
  },
  pricingDecisions: {
    id: 'e1000000-0000-0000-0000-000000000003',
    name: 'Pricing Decisions',
  },
  betaFeedback: {
    id: 'e1000000-0000-0000-0000-000000000004',
    name: 'Beta Feedback',
  },
  competitorInsights: {
    id: 'e1000000-0000-0000-0000-000000000005',
    name: 'Competitor Insights',
  },
  openCritical: {
    id: 'e1000000-0000-0000-0000-000000000007',
    name: 'Open Critical',
  },
} as const

/** Seed events total count (used in stat card assertions) */
export const SEED_TOTAL_EVENTS = 10

/** Event used for detail page tests — stable, unlikely to change */
export const DETAIL_EVENT = EVENTS.launchBlocker

/** Event used for auth category filter tests */
export const AUTH_EVENT = EVENTS.oauthCookieBug
