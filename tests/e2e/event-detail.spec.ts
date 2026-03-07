import { test, expect } from '@playwright/test'
import { goto, matchSnapshot } from '../helpers/navigation'
import { DETAIL_EVENT, EVENTS } from '../fixtures/test-data'

const DETAIL_URL = '/events/' + DETAIL_EVENT.id

test.describe('Event Detail', () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, DETAIL_URL, '[data-testid="event-detail-page"]')
  })

  test('page renders without errors', async ({ page }) => {
    await expect(page.locator('[data-testid="event-detail-page"]')).toBeVisible()
  })

  test('shows the correct event title @visual', async ({ page }) => {
    const title = page.locator('[data-testid="event-title"]')
    await expect(title).toBeVisible()
    await expect(title).toContainText('LAUNCH BLOCKER')
  })

  test('shows severity, status, and category badges @visual', async ({ page }) => {
    const badges = page.locator('[data-testid="event-badges"]')
    await expect(badges).toBeVisible()
    // Critical severity badge
    await expect(badges).toContainText('Critical')
    // Open status
    await expect(badges).toContainText('Open')
  })

  test('shows the summary section @visual', async ({ page }) => {
    const summary = page.locator('[data-testid="event-summary-section"]')
    await expect(summary).toBeVisible()
    // Summary heading visible
    await expect(summary.getByText('Summary')).toBeVisible()
    // Has actual summary content
    const text = await summary.textContent()
    expect(text?.length).toBeGreaterThan(50)
  })

  test('shows the raw content section @visual', async ({ page }) => {
    const rawSection = page.locator('[data-testid="event-raw-content"]')
    await expect(rawSection).toBeVisible()
    await expect(rawSection.getByText('Raw Content')).toBeVisible()
    // Pre block with content
    const pre = rawSection.locator('pre')
    await expect(pre).toBeVisible()
    const content = await pre.textContent()
    expect(content?.length).toBeGreaterThan(100)
  })

  test('back link navigates to explorer', async ({ page }) => {
    const backLink = page.getByRole('link', { name: 'Back to Explorer' })
    await expect(backLink).toBeVisible()
    await backLink.click()
    await page.waitForURL('**/explorer')
    await expect(page.locator('[data-testid="explorer-page"]')).toBeVisible()
  })

  test('edit link navigates to edit page', async ({ page }) => {
    const editLink = page.getByRole('link', { name: 'Edit' })
    await expect(editLink).toBeVisible()
    await editLink.click()
    await page.waitForURL('**/events/' + DETAIL_EVENT.id + '/edit')
    await expect(page.locator('[data-testid="ingest-form"]')).toBeVisible()
  })

  test('full event detail snapshot @visual', async ({ page }) => {
    await matchSnapshot(page, 'event-detail-launch-blocker', 'page', [
      'section:has(h2:text("Metadata"))',
      'div.flex.flex-wrap.items-center.gap-4',
    ])
  })

  test('event detail badges snapshot @visual', async ({ page }) => {
    await matchSnapshot(page, 'event-detail-badges', '[data-testid="event-badges"]')
  })

  test('OAuth event detail renders correctly @visual', async ({ page }) => {
    await goto(
      page,
      '/events/' + EVENTS.oauthCookieBug.id,
      '[data-testid="event-detail-page"]'
    )
    const title = page.locator('[data-testid="event-title"]')
    await expect(title).toContainText('cookie blocking')

    const badges = page.locator('[data-testid="event-badges"]')
    await expect(badges).toContainText('High')
    await expect(badges).toContainText('In Progress')
  })
})
