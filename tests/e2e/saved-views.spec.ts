import { test, expect } from '@playwright/test'
import { goto, matchSnapshot } from '../helpers/navigation'
import { VIEWS } from '../fixtures/test-data'

test.describe('Saved Views', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, '/views', '[data-testid="views-page"]')
  })

  test('renders the saved views page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Saved Views' })).toBeVisible()
  })

  test('shows all seeded saved views @visual', async ({ page }) => {
    const list = page.locator('[data-testid="views-list"]')
    await expect(list).toBeVisible()

    // Check all seeded view names are present
    await expect(list.getByRole('link', { name: VIEWS.authAndOAuth.name })).toBeVisible()
    await expect(list.getByRole('link', { name: VIEWS.launchBlockers.name })).toBeVisible()
    await expect(list.getByRole('link', { name: VIEWS.pricingDecisions.name })).toBeVisible()
    await expect(list.getByRole('link', { name: VIEWS.betaFeedback.name })).toBeVisible()
    await expect(list.getByRole('link', { name: VIEWS.competitorInsights.name })).toBeVisible()
    await expect(list.getByRole('link', { name: VIEWS.openCritical.name })).toBeVisible()

    await matchSnapshot(page, 'saved-views-list', 'page', [
      '[data-testid="view-item"] span.text-xs.text-muted-foreground',
    ])
  })

  test('clicking a view navigates to filtered explorer @visual', async ({ page }) => {
    const list = page.locator('[data-testid="views-list"]')
    const authViewLink = list.getByRole('link', { name: VIEWS.authAndOAuth.name })
    await expect(authViewLink).toBeVisible()
    await authViewLink.click()

    // Should navigate to /explorer?view=<id>
    await page.waitForURL('**/explorer?view=' + VIEWS.authAndOAuth.id, { timeout: 15_000 })
    await expect(page.locator('[data-testid="explorer-page"]')).toBeVisible()

    // Heading should reflect the saved view name
    await expect(page.getByRole('heading', { name: VIEWS.authAndOAuth.name })).toBeVisible()

    // Table should be loaded with auth events
    await expect(page.locator('[data-testid="events-table"]')).toBeVisible()

    await matchSnapshot(page, 'saved-views-explorer-auth', 'page', [
      '[data-testid="events-count"]',
      'td:last-child',
    ])
  })

  test('launch blockers view loads correctly @visual', async ({ page }) => {
    const list = page.locator('[data-testid="views-list"]')
    await list.getByRole('link', { name: VIEWS.launchBlockers.name }).click()

    await page.waitForURL('**/explorer?view=' + VIEWS.launchBlockers.id)
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: VIEWS.launchBlockers.name })).toBeVisible()
  })

  test('sidebar quick views section shows saved view shortcuts', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]')
    // Quick Views section with view shortcuts should be present in sidebar
    await expect(sidebar.getByText('Quick Views')).toBeVisible()
    await expect(sidebar.getByText(VIEWS.authAndOAuth.name)).toBeVisible()
  })
})
