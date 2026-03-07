-- ============================================================
-- VCTRL Knowledge System — Seed Data
-- Realistic VCTRL project events
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- PROJECT
-- ────────────────────────────────────────────────────────────

INSERT INTO projects (id, name, slug, description) VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'VCTRL',
  'vctrl',
  'VCTRL is a developer tool for version-controlled build orchestration, real-time CI alerts, and team-wide deployment visibility.'
);

-- ────────────────────────────────────────────────────────────
-- SOURCES
-- ────────────────────────────────────────────────────────────

INSERT INTO sources (id, project_id, type, name, original_url, imported_at) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'chatgpt_web',    'ChatGPT — OAuth Debug Session',         'https://chatgpt.com/c/oauth-debug-001',        now() - interval '14 days'),
  ('b1000000-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'chatgpt_web',    'ChatGPT — Pricing Strategy Session',    'https://chatgpt.com/c/pricing-strategy-001',   now() - interval '10 days'),
  ('b1000000-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'manual',         'Beta Tester Feedback — Slack Thread',   NULL,                                           now() - interval '7 days'),
  ('b1000000-0000-0000-0000-000000000004', 'a1b2c3d4-0000-0000-0000-000000000001', 'manual',         'App Store Review Board Notes',          NULL,                                           now() - interval '5 days'),
  ('b1000000-0000-0000-0000-000000000005', 'a1b2c3d4-0000-0000-0000-000000000001', 'claude_web',     'Claude — Competitor Analysis Session',  NULL,                                           now() - interval '3 days'),
  ('b1000000-0000-0000-0000-000000000006', 'a1b2c3d4-0000-0000-0000-000000000001', 'manual',         'Roadmap Planning Session Notes',        NULL,                                           now() - interval '2 days');

-- ────────────────────────────────────────────────────────────
-- TAGS
-- ────────────────────────────────────────────────────────────

INSERT INTO tags (id, name, slug) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'oauth',           'oauth'),
  ('c1000000-0000-0000-0000-000000000002', 'auth',            'auth'),
  ('c1000000-0000-0000-0000-000000000003', 'beta',            'beta'),
  ('c1000000-0000-0000-0000-000000000004', 'pricing',         'pricing'),
  ('c1000000-0000-0000-0000-000000000005', 'launch',          'launch'),
  ('c1000000-0000-0000-0000-000000000006', 'ux',              'ux'),
  ('c1000000-0000-0000-0000-000000000007', 'competitor',      'competitor'),
  ('c1000000-0000-0000-0000-000000000008', 'app-store',       'app-store'),
  ('c1000000-0000-0000-0000-000000000009', 'real-time',       'real-time'),
  ('c1000000-0000-0000-0000-000000000010', 'build-alerts',    'build-alerts'),
  ('c1000000-0000-0000-0000-000000000011', 'subscriptions',   'subscriptions'),
  ('c1000000-0000-0000-0000-000000000012', 'onboarding',      'onboarding'),
  ('c1000000-0000-0000-0000-000000000013', 'cookie-policy',   'cookie-policy'),
  ('c1000000-0000-0000-0000-000000000014', 'github',          'github'),
  ('c1000000-0000-0000-0000-000000000015', 'ci-cd',           'ci-cd');

-- ────────────────────────────────────────────────────────────
-- EVENTS
-- ────────────────────────────────────────────────────────────

INSERT INTO events (id, project_id, source_id, title, summary, raw_text, event_type, category, severity, status, event_timestamp) VALUES

-- 1. Selective cookie blocking breaks GitHub OAuth
(
  'd1000000-0000-0000-0000-000000000001',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000001',
  'Selective cookie blocking breaks GitHub OAuth callback',
  'Users with strict browser cookie settings (Firefox Enhanced Tracking Protection, Brave Shields) fail the GitHub OAuth callback. The session cookie set by Supabase during the OAuth handshake is blocked as a third-party cookie, causing a silent redirect loop back to /login. Requires domain-matching fix or first-party cookie workaround.',
  E'## Problem\nUsers hitting /auth/callback after GitHub OAuth were being silently redirected back to /login with no error shown.\n\n## Root Cause\nIdentified via ChatGPT debug session: Supabase sets the auth session cookie during the OAuth callback. In browsers with strict cookie policies (Firefox ETP set to "Strict", Brave with Shields up), this cookie is classified as third-party because the callback domain is on Supabase''s infrastructure before being redirected back to our domain.\n\n## Reproduction Steps\n1. Open Firefox, set Enhanced Tracking Protection to "Strict"\n2. Click "Login with GitHub" on VCTRL\n3. Authorize on GitHub\n4. Get redirected back — observe silent loop back to /login\n\n## Fix Investigated\n- Option A: Use PKCE flow (Supabase supports this) — keeps everything first-party\n- Option B: Custom domain for Supabase auth so cookies are same-origin\n- Option C: Detect the failure and show a user-facing error with instructions to allow cookies\n\n## Decision\nImplement PKCE flow as primary fix. Add fallback cookie error detection for Option C as safety net.\n\n## Status\nPKCE branch in progress. ETA: 2 days.',
  'bug_note',
  'auth_oauth',
  'high',
  'in_progress',
  now() - interval '14 days'
),

-- 2. Login cancel / retry error loop
(
  'd1000000-0000-0000-0000-000000000002',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000001',
  'Login cancel and retry creates broken auth state',
  'When a user clicks "Login with GitHub", cancels on the GitHub authorization screen, and then tries again immediately, the app enters a broken state. The Supabase OAuth state token has already been consumed or expired and the retry fails with a 400. User must hard refresh.',
  E'## Problem\nUser cancels GitHub OAuth mid-flow, returns to app, tries to log in again immediately. Second attempt fails with a cryptic error.\n\n## Error\n```\nOAuth state mismatch. Expected: abc123, Got: null\n```\n\n## Root Cause\nThe OAuth `state` parameter is consumed on the first redirect attempt even if the user cancels. On the second attempt, the state is no longer in storage, causing the mismatch.\n\n## Fix\nClear the stored OAuth state on the /login route whenever the user lands there without completing auth. Reset the state before initiating a new OAuth flow.\n\nAlso: Show a cleaner error message if we detect this case instead of the raw 400.\n\n## Notes\n- This is a common OAuth UX pitfall, not specific to Supabase\n- Add an error boundary around the auth callback page\n\n## Priority\nMedium — affects friction but not blocking core flow.',
  'bug_note',
  'auth_oauth',
  'medium',
  'open',
  now() - interval '13 days'
),

-- 3. Beta tester auth friction report
(
  'd1000000-0000-0000-0000-000000000003',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000003',
  'Beta testers report confusing auth flow — 3 of 5 needed help',
  'First beta cohort (5 users) completed onboarding tasks. 3 out of 5 got stuck or confused at the GitHub OAuth step. Two said they didn''t understand why VCTRL needed GitHub access. One user thought the app was broken when they were redirected to GitHub.',
  E'## Beta Feedback Summary — Auth Flow\n\nCohort: 5 beta testers (all developers, varying seniority)\nTask: Sign up and connect a repo\n\n### Issues Reported\n\n**User A (senior dev):**\n- "The redirect to GitHub felt sudden. I wasn''t sure if I was still in VCTRL."\n- Completed flow successfully but expressed confusion.\n\n**User B (mid-level dev):**\n- Didn''t understand the GitHub permissions list.\n- Asked: "Why does this app need access to my private repos?"\n- VCTRL only needs public repo read access — we should narrow the scope.\n\n**User C (junior dev):**\n- Thought the app crashed when redirected to GitHub.\n- Sat on the GitHub auth screen for 2 minutes before proceeding.\n\n**User D:** No issues.\n**User E:** No issues.\n\n### Action Items\n1. Add pre-OAuth context screen explaining WHY GitHub is needed\n2. Narrow GitHub OAuth scope to minimum required\n3. Add a loading/redirect indicator so users know they''re coming back\n4. Consider: add email fallback login for users without GitHub\n\n### Priority\nHigh — this is the first interaction users have with the product.',
  'feedback',
  'beta_feedback',
  'high',
  'open',
  now() - interval '7 days'
),

-- 4. Pricing decision: subscription tiers
(
  'd1000000-0000-0000-0000-000000000004',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000002',
  'Pricing decision: 3-tier subscription model with solo dev free tier',
  'After analysis with ChatGPT, decided on a 3-tier pricing model: Free (solo dev, 1 project, 5 alerts/day), Pro ($12/mo, 5 projects, unlimited alerts, team features), Team ($49/mo, unlimited projects, SSO, audit logs). No usage-based pricing for V1 — keep it simple.',
  E'## Pricing Decision — VCTRL V1\n\n### Context\nEvaluated pricing models for a developer tool targeting solo devs and small engineering teams.\n\n### Options Evaluated\n\n**Option A: Usage-based (per alert/per build)**\n- Pros: Fair, scales with value\n- Cons: Complex to explain, anxiety-inducing for users, hard to predict revenue\n- Verdict: Too early for this. Not in V1.\n\n**Option B: Simple flat tiers**\n- Pros: Easy to understand, predictable, easy to implement\n- Cons: Might leave money on the table at scale\n- Verdict: Right call for V1.\n\n**Option C: Per-seat**\n- Pros: Scales with team size\n- Cons: Creates friction for team adoption, hard to justify for solo devs\n- Verdict: Considered for Team tier but not primary model.\n\n### Decision: 3-Tier Flat Pricing\n\n| Tier | Price | Projects | Alerts/Day | Notes |\n|------|-------|----------|------------|-------|\n| Free | $0 | 1 | 5 | Solo dev, no CC required |\n| Pro | $12/mo | 5 | Unlimited | Team features, Slack integration |\n| Team | $49/mo | Unlimited | Unlimited | SSO, audit logs, priority support |\n\n### Rationale\n- Free tier must be genuinely useful to drive adoption and word-of-mouth\n- Pro price point is impulse-buy range for devs with any budget\n- Team tier anchors perception and captures real B2B value\n- Annual discount: 20% off (implement in V2)\n\n### Open Questions\n- Should Pro include Slack integration or gate it to Team?\n- How do we handle repo count vs project count?\n\n### Next Step\nBuild Stripe integration in V2 milestone.',
  'decision',
  'pricing',
  'high',
  'resolved',
  now() - interval '10 days'
),

-- 5. Launch blocker: real-time build alerts unstable on free Supabase plan
(
  'd1000000-0000-0000-0000-000000000005',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000006',
  'LAUNCH BLOCKER: Supabase Realtime drops connections on free plan',
  'Real-time build alert delivery is unreliable on the Supabase free plan due to connection limits and 1-second poll intervals being throttled. This is a launch blocker — the core value prop of VCTRL is instant build alerts. Must resolve before any public launch.',
  E'## Launch Blocker Report\n\n### Feature Affected\nReal-time build status alerts (core feature)\n\n### Problem\nOn the Supabase free plan, Realtime connections are capped at 200 concurrent. During testing with 3 simulated clients, we observed:\n- Connections dropping after ~8 minutes idle\n- 3-5 second delay on alert delivery (should be <1s)\n- Occasional "channel closed" errors with no client-side recovery\n\n### Why This Is A Blocker\nVCTRL''s primary value is: "Know the moment your build breaks."\nIf alerts arrive 5 seconds late or not at all, the core promise is broken.\n\n### Options\n\n**Option A: Upgrade Supabase to Pro ($25/mo)**\n- Removes connection limits\n- 500ms or better latency\n- Straightforward fix\n- Cost acceptable for launch infrastructure\n\n**Option B: Self-manage Realtime with Ably or Pusher**\n- More control\n- Additional vendor dependency\n- Overkill for V1\n\n**Option C: Polling fallback**\n- 2-second poll as fallback when Realtime drops\n- Can ship faster, graceful degradation\n- Not ideal but acceptable for beta\n\n### Decision\nUpgrade to Supabase Pro before launch. Implement Option C (poll fallback) as belt-and-suspenders.\n\n### Status\nBlocking launch. Supabase Pro upgrade pending billing setup.\n\n### Owner\n@dom — handle before EOW.',
  'blocker',
  'launch_blocker',
  'critical',
  'open',
  now() - interval '2 days'
),

-- 6. Competitor insight: Linear-style UX clarity
(
  'd1000000-0000-0000-0000-000000000006',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000005',
  'Competitor insight: Buildkite UI is dense but users praise "information density"',
  'Deep review of Buildkite and CircleCI UX. Key finding: power users actively prefer dense information views — they do NOT want cards and whitespace. They want log lines, status badges, and fast keyboard navigation. VCTRL should lean into developer-native UI patterns, not consumer SaaS patterns.',
  E'## Competitor UX Review — Build Alerting Tools\n\nReviewed: Buildkite, CircleCI, GitHub Actions, Depot, Nx Cloud\n\n### Key Findings\n\n**Buildkite**\n- Dense UI with many columns — initially overwhelming\n- Users on Reddit/HN consistently praise the density: "I can see everything at once"\n- Fast keyboard shortcuts: J/K navigation, F to filter, S to search\n- Verdict: Their density is a feature, not a bug\n\n**CircleCI**\n- Tried to go more consumer-friendly with redesign in 2023\n- Power users complained loudly — "too much whitespace"\n- They partially rolled back\n- Lesson: developer tools should not copy consumer SaaS patterns\n\n**GitHub Actions**\n- Good: Inline log streaming is excellent\n- Bad: Finding a specific step across a matrix build is painful\n- Opportunity: VCTRL can win on "find what failed faster"\n\n**Depot**\n- Clean, minimal\n- But lacks live status density\n- More focused on speed, less on observability\n\n### Strategic Insight for VCTRL\n1. Embrace information density — compact rows, lots of data in view\n2. Build keyboard shortcuts from day 1\n3. Status badges > status text\n4. Log streaming should feel like a terminal, not a chat window\n5. Do NOT over-card the UI — developers hate excessive whitespace\n\n### Design Implications\n- Event explorer: use compact table rows, not cards\n- Dashboard: dense stats grid, not hero metrics\n- Build detail: terminal-style log viewer\n\n### Priority\nHigh — inform next design iteration before any design finalization.',
  'insight',
  'competitor_insight',
  'medium',
  'resolved',
  now() - interval '3 days'
),

-- 7. App Store rejection note
(
  'd1000000-0000-0000-0000-000000000007',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000004',
  'App Store rejection: missing privacy policy link on sign-in screen',
  'Apple rejected the VCTRL iOS companion app (Review ID: 2024-ARB-88812) for missing a privacy policy link on the sign-in screen. Required by App Store guideline 5.1.1. Simple fix: add privacy policy URL to the auth screen footer.',
  E'## App Store Rejection — Review ID: 2024-ARB-88812\n\n### Rejection Reason\nGuideline 5.1.1 — Legal — Privacy Policy\n\n> Your app collects user data but does not include a link to your privacy policy on the sign-in screen or within the app.\n\n### Screenshot\n[See Figma: iOS Auth Screen v1.2 — missing footer links]\n\n### Fix Required\nAdd Privacy Policy and Terms of Service links to:\n1. Sign-in screen footer\n2. Settings > Legal section\n3. App Store listing description\n\n### Status of Privacy Policy\n- Privacy Policy: Drafted, hosted at vctrl.dev/legal/privacy — LIVE\n- Terms of Service: Drafted, hosted at vctrl.dev/legal/terms — LIVE\n\n### Implementation\n- Add footer component to AuthScreen with links to both docs\n- Links must be tappable, not just decorative text\n- Policy must cover: data collected, third parties, user rights\n\n### Timeline\n- Fix implemented: done\n- Resubmit: today\n- Expected review: 24-48 hours\n\n### Lesson\nAlways add legal links to auth screens before submission. Add this to pre-submission checklist.',
  'reference',
  'app_store',
  'high',
  'resolved',
  now() - interval '5 days'
),

-- 8. Marketing idea: "Build confidence" positioning
(
  'd1000000-0000-0000-0000-000000000008',
  'a1b2c3d4-0000-0000-0000-000000000001',
  NULL,
  'Marketing positioning: "Build confidence, not anxiety" as core message',
  'Insight from user interviews and positioning work: developers using CI/CD without VCTRL describe the feeling as "deployment anxiety" — not knowing if a build passed until someone mentions it in Slack. VCTRL solves emotional pain, not just technical pain. Core message: "Build confidence, not anxiety."',
  E'## Marketing Positioning Note\n\n### Insight\nDuring 4 user interviews this week, 3 of 4 developers used the word "anxiety" or "stress" when describing waiting for build status without a tool like VCTRL.\n\nQuotes:\n- "I literally refresh the CI page every 30 seconds. It''s stupid but I can''t help it."\n- "The worst part of deploying is not knowing if it worked."\n- "I have to ping someone in Slack just to find out if the build passed."\n\n### Implication\nVCTRL is solving emotional pain (anxiety, uncertainty) not just technical pain (slow alerts).\n\n### Positioning Candidate\n**Tagline:** "Build confidence, not anxiety."\n**Sub-headline:** "Real-time build alerts so you always know the moment something breaks — or ships."\n\n### Landing Page Angle\n- Lead with the emotional hook: "Stop refreshing. Start shipping."\n- Show the moment of relief: build passes, alert fires, developer can move on\n- Use developer-native language: not "notifications" but "alerts" and "build events"\n\n### Competitor Differentiation\nCompetitors position on speed (Depot: "10x faster builds") or reliability.\nVCTRL can own the awareness/alerting angle.\n\n### Next Step\n- Write landing page copy draft using this positioning\n- Test with 3 more devs before finalizing\n- Build mockup: split-screen "before/after" showing anxiety vs confidence',
  'decision',
  'marketing',
  'medium',
  'open',
  now() - interval '1 day'
),

-- 9. Roadmap update: V2 feature prioritization
(
  'd1000000-0000-0000-0000-000000000009',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000006',
  'Roadmap V2: Slack integration and team notifications prioritized',
  'After beta feedback and market review, V2 roadmap is set. Top priorities: Slack integration for team alerts, multi-user team accounts, build history analytics dashboard, and GitHub Actions native integration. Stripe billing deferred to V2.1.',
  E'## VCTRL V2 Roadmap — Planning Session Notes\n\n### Context\n- V1 launch target: 3 weeks\n- V2 planning horizon: 6-8 weeks post-V1\n- Input: 5 beta users, 4 user interviews, competitor analysis\n\n### V2 Feature Priorities (ranked)\n\n**P0 — Must ship V2.0**\n1. Slack integration — most requested feature (4/5 betas asked for it)\n2. Team accounts — multi-user, shared build views\n3. Build history + analytics dashboard (7-day trend, failure rate)\n4. GitHub Actions native integration (currently webhook-only)\n\n**P1 — Strong candidates for V2.0**\n5. Email digest (daily build summary)\n6. Custom alert rules (only alert on failure, not success)\n7. Mobile push notifications (companion app)\n\n**P2 — V2.1 or later**\n8. Stripe billing + subscription management\n9. SSO (SAML/Okta)\n10. Audit logs\n11. GitLab integration\n\n### Deferred from V1\n- Stripe billing: deprioritized — launch on free/waitlist first, monetize V2\n- SSO: not needed until we have team customers\n\n### Build Sequence\nV2.0: Slack + Team + Analytics + GitHub Actions\nV2.1: Billing + Email digest + Custom rules\nV3: SSO + Audit logs + GitLab\n\n### Open Questions\n- Should team accounts come before Slack? (Slack without teams feels incomplete)\n- How do we handle trial vs paid for team features in V2?\n\n### Decision\nBuild Slack integration first — standalone value even for solo users.',
  'update',
  'roadmap',
  'medium',
  'open',
  now() - interval '2 days'
),

-- 10. OAuth decision: PKCE flow adoption
(
  'd1000000-0000-0000-0000-000000000010',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000001',
  'Auth decision: Adopt PKCE flow for all OAuth providers',
  'Decision made to standardize on PKCE (Proof Key for Code Exchange) for all OAuth flows in VCTRL. This resolves cookie-blocking issues, improves security posture, and is Supabase''s recommended approach. Applies to GitHub OAuth and any future providers (Google, GitLab).',
  E'## Auth Architecture Decision — PKCE Flow\n\n### Decision\nAdopt PKCE (Proof Key for Code Exchange) as the standard OAuth flow for VCTRL.\n\n### Context\nThe cookie-blocking bug revealed that our current implicit OAuth flow was fragile in strict browser environments. PKCE is the modern, recommended approach for SPAs and apps with redirects.\n\n### What is PKCE?\nPKCE adds a code verifier/challenge pair to the OAuth flow:\n1. App generates a random `code_verifier`\n2. App sends `code_challenge` (SHA-256 hash of verifier) with the auth request\n3. After redirect, app sends `code_verifier` to exchange for token\n4. Server verifies the verifier matches the challenge\n\nThis eliminates the need to store sensitive state in cookies that can be blocked.\n\n### Supabase Support\n- Supabase Auth supports PKCE natively\n- Enable via: `flowType: ''pkce''` in createClient options\n- Works with GitHub, Google, GitLab OAuth\n\n### Implementation\n```typescript\n// lib/supabase/client.ts\nconst supabase = createBrowserClient(\n  process.env.NEXT_PUBLIC_SUPABASE_URL!,\n  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,\n  {\n    auth: {\n      flowType: ''pkce'',\n    },\n  }\n)\n```\n\n### Impact\n- Fixes: Cookie-blocking bug\n- Fixes: Cancel/retry auth state bug (PKCE verifier stored in sessionStorage, cleared on new attempt)\n- Improves: Security posture (eliminates token in URL fragment)\n- Improves: Future-proofing (PKCE is the OAuth 2.1 standard)\n\n### Applies To\n- GitHub OAuth (current)\n- Google OAuth (planned)\n- GitLab OAuth (V3)\n\n### Status\nImplemented in branch `feat/pkce-auth`. Merge after testing.',
  'decision',
  'auth_oauth',
  'high',
  'resolved',
  now() - interval '12 days'
);

-- ────────────────────────────────────────────────────────────
-- EVENT TAGS
-- ────────────────────────────────────────────────────────────

INSERT INTO event_tags (event_id, tag_id) VALUES
  -- Event 1: cookie blocking OAuth
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001'), -- oauth
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002'), -- auth
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000013'), -- cookie-policy

  -- Event 2: login cancel retry
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001'), -- oauth
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002'), -- auth
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000006'), -- ux

  -- Event 3: beta auth friction
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000003'), -- beta
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002'), -- auth
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000006'), -- ux
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000012'), -- onboarding

  -- Event 4: pricing decision
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004'), -- pricing
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000011'), -- subscriptions

  -- Event 5: launch blocker realtime
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000005'), -- launch
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000009'), -- real-time
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000010'), -- build-alerts

  -- Event 6: competitor insight
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000007'), -- competitor
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000006'), -- ux
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000010'), -- build-alerts

  -- Event 7: app store rejection
  ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000008'), -- app-store
  ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000005'), -- launch

  -- Event 8: marketing positioning
  ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000005'), -- launch

  -- Event 9: roadmap V2
  ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000015'), -- ci-cd
  ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000014'), -- github
  ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000010'), -- build-alerts

  -- Event 10: PKCE decision
  ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000001'), -- oauth
  ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000002'); -- auth

-- ────────────────────────────────────────────────────────────
-- SAVED VIEWS
-- ────────────────────────────────────────────────────────────

INSERT INTO saved_views (id, project_id, name, description, filter_state) VALUES
(
  'e1000000-0000-0000-0000-000000000001',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Auth & OAuth',
  'All authentication and OAuth-related events',
  '{"category": "auth_oauth"}'
),
(
  'e1000000-0000-0000-0000-000000000002',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Launch Blockers',
  'Critical and high-severity open blockers',
  '{"category": "launch_blocker", "severity": ["critical", "high"], "status": "open"}'
),
(
  'e1000000-0000-0000-0000-000000000003',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Pricing Decisions',
  'All pricing and monetization decisions',
  '{"category": "pricing"}'
),
(
  'e1000000-0000-0000-0000-000000000004',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Beta Feedback',
  'Feedback from beta testers',
  '{"category": "beta_feedback"}'
),
(
  'e1000000-0000-0000-0000-000000000005',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Competitor Insights',
  'Competitor research and market analysis',
  '{"category": "competitor_insight"}'
),
(
  'e1000000-0000-0000-0000-000000000006',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'App Store Readiness',
  'App Store submission notes and rejections',
  '{"category": "app_store"}'
),
(
  'e1000000-0000-0000-0000-000000000007',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Open Critical',
  'All open critical and high severity events',
  '{"severity": ["critical", "high"], "status": "open"}'
);
