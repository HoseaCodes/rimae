import { test, expect } from '@playwright/test'
import { goto, matchSnapshot, MASK } from '../helpers/navigation'
import { SEED_TOTAL_EVENTS, VIEWS } from '../fixtures/test-data'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/', '[data-testid="dashboard-page"]')
  })

  test('renders the page heading @visual', async ({ page }) => {
    const heading = page.locator('[data-testid="dashboard-heading"]')
    await expect(heading).toBeVisible()
    await expect(heading).toHaveText('RIMAE Knowledge Base')
  })

  test('stats grid shows all four cards @visual', async ({ page }) => {
    const grid = page.locator('[data-testid="stats-grid"]')
    await expect(grid).toBeVisible()

    // All four stat cards present
    await expect(page.locator('[data-testid="stat-total"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-open"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-critical-high"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-resolved"]')).toBeVisible()

    // Total events reflects at least the seed data count (may be higher from test runs)
    const statNum = Number(await page.locator('[data-testid="stat-total"] .tabular-nums').textContent())
    expect(statNum).toBeGreaterThanOrEqual(SEED_TOTAL_EVENTS)
  })

  test('recent events section renders with seeded events @visual', async ({ page }) => {
    const section = page.locator('[data-testid="recent-events-section"]')
    await expect(section).toBeVisible()
    // At least one event row visible
    await expect(section.locator('a').first()).toBeVisible()
  })

  test('saved views section shows seeded views @visual', async ({ page }) => {
    const section = page.locator('[data-testid="saved-views-section"]')
    await expect(section).toBeVisible()
    // "Auth & OAuth" is a known seeded view
    await expect(section.getByText(VIEWS.authAndOAuth.name)).toBeVisible()
    await expect(section.getByText(VIEWS.launchBlockers.name)).toBeVisible()
  })

  test('sidebar is visible and shows correct nav items @visual', async ({ page }) => {
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-explorer"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-ingest"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-views"]')).toBeVisible()
  })

  test('full dashboard snapshot @visual', async ({ page }) => {
    await matchSnapshot(page, 'dashboard-full', 'page', [
      '[data-testid="stats-grid"]',
      '[data-testid="recent-events-section"]',
      '[data-testid="category-section"]',
    ])
  })

  test('stats grid snapshot @visual', async ({ page }) => {
    await matchSnapshot(page, 'dashboard-stats-grid', '[data-testid="stats-grid"]')
  })
})
