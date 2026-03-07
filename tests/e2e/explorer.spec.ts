import { test, expect } from '@playwright/test'
import { goto, matchSnapshot } from '../helpers/navigation'
import { EVENTS, VIEWS, SEED_TOTAL_EVENTS } from '../fixtures/test-data'

test.describe('Event Explorer', () => {
  test('renders default explorer state with seeded events @visual', async ({ page }) => {
    await goto(page, '/explorer', '[data-testid="explorer-page"]')

    // Heading visible
    await expect(page.getByRole('heading', { name: 'Event Explorer' })).toBeVisible()

    // Filters bar rendered
    await expect(page.locator('[data-testid="explorer-filters"]')).toBeVisible()
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible()

    // Table with events
    await expect(page.locator('[data-testid="events-table"]')).toBeVisible()

    // Count text shows events
    const countText = await page.locator('[data-testid="events-count"]').textContent() ?? ''
    const countNum = Number(countText.trim().split(' ')[1] ?? '0')
    expect(countNum).toBeGreaterThanOrEqual(SEED_TOTAL_EVENTS)

    // Seeded event title visible in table
    await expect(page.getByText(EVENTS.launchBlocker.title)).toBeVisible()

    await matchSnapshot(page, 'explorer-default', 'page', [
      '[data-testid="events-count"]',
      '[data-testid="events-table"]',
    ])
  })

  test('filters by category: auth_oauth shows auth events @visual', async ({ page }) => {
    await goto(page, '/explorer?category=auth_oauth', '[data-testid="events-table"]')

    // Known auth events should appear
    await expect(page.getByText(EVENTS.oauthCookieBug.title)).toBeVisible()
    await expect(page.getByText(EVENTS.pkceDecision.title)).toBeVisible()

    // Launch blocker (different category) should NOT appear
    await expect(page.getByText(EVENTS.launchBlocker.title)).not.toBeVisible()

    await matchSnapshot(page, 'explorer-filtered-auth', 'page', [
      '[data-testid="events-count"]',
      'td:last-child',
    ])
  })

  test('filters by severity: critical shows only critical events @visual', async ({ page }) => {
    await goto(page, '/explorer?severity=critical', '[data-testid="events-table"]')

    // Launch blocker is the only critical seeded event
    await expect(page.getByText(EVENTS.launchBlocker.title)).toBeVisible()

    await matchSnapshot(page, 'explorer-filtered-critical', '[data-testid="events-table"]')
  })

  test('search input filters results', async ({ page }) => {
    await goto(page, '/explorer', '[data-testid="search-input"]')

    const searchInput = page.locator('[data-testid="search-input"]')
    await searchInput.fill('oauth')

    // Wait for debounce + navigation
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(600)

    // OAuth events should appear
    await expect(page.getByText(EVENTS.oauthCookieBug.title)).toBeVisible()
  })

  test('empty state renders when filter matches nothing @visual', async ({ page }) => {
    // Search for a nonsense string guaranteed to match nothing
    await goto(page, '/explorer?q=zzznomatchxxx', '[data-testid="events-table-empty"]')

    await expect(page.locator('[data-testid="events-table-empty"]')).toBeVisible()
    await expect(page.getByText('No events match your filters')).toBeVisible()

    await matchSnapshot(page, 'explorer-empty-state', '[data-testid="events-table-empty"]')
  })

  test('tag filter shows only tagged events @visual', async ({ page }) => {
    await goto(page, '/explorer?tag=oauth', '[data-testid="events-table"]')

    // All oauth-tagged events should appear
    await expect(page.getByText(EVENTS.oauthCookieBug.title)).toBeVisible()

    await matchSnapshot(page, 'explorer-filtered-tag', '[data-testid="events-table"]')
  })

  test('clicking an event row navigates to event detail', async ({ page }) => {
    await goto(page, '/explorer', '[data-testid="events-table"]')

    // Find the launch blocker row and click its title link
    const row = page.locator('[data-event-id="' + EVENTS.launchBlocker.id + '"]')
    await expect(row).toBeVisible()
    await row.locator('a').first().click()

    // Should navigate to the event detail page
    await page.waitForURL('**/events/' + EVENTS.launchBlocker.id)
    await expect(page.locator('[data-testid="event-detail-page"]')).toBeVisible()
  })

  test('saved view loads filtered state @visual', async ({ page }) => {
    await goto(
      page,
      '/explorer?view=' + VIEWS.authAndOAuth.id,
      '[data-testid="events-table"]'
    )

    // Heading should show the view name
    await expect(page.getByRole('heading', { name: VIEWS.authAndOAuth.name })).toBeVisible()

    // Auth events should be visible
    await expect(page.getByText(EVENTS.oauthCookieBug.title)).toBeVisible()

    await matchSnapshot(page, 'explorer-saved-view-auth', 'page', [
      '[data-testid="events-count"]',
      'td:last-child',
    ])
  })
})
