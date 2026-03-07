import { test, expect } from '@playwright/test'
import { goto, matchSnapshot } from '../helpers/navigation'

const UNIQUE_TITLE = 'E2E Test Event — Playwright Visual Suite'
const UNIQUE_RAW = 'This event was created by the Playwright e2e test suite. It verifies the ingest form submits correctly and redirects to the event detail page.'

test.describe('Ingest / Create Event', () => {
  test('renders the ingest form @visual', async ({ page }) => {
    await goto(page, '/ingest', '[data-testid="ingest-form"]')

    await expect(page.locator('[data-testid="ingest-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="input-title"]')).toBeVisible()
    await expect(page.locator('[data-testid="input-raw-text"]')).toBeVisible()
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="cancel-button"]')).toBeVisible()

    await matchSnapshot(page, 'ingest-form-blank', 'page', ['input[type="datetime-local"]'])
  })

  test('form shows validation error when title is missing', async ({ page }) => {
    await goto(page, '/ingest', '[data-testid="ingest-form"]')

    // Fill raw_text but leave title empty
    await page.locator('[data-testid="input-raw-text"]').fill('Some content without a title')
    await page.locator('[data-testid="submit-button"]').click()

    // Wait for error message to appear
    await expect(page.locator('text=required').or(page.locator('.text-red-400')).first()).toBeVisible({ timeout: 5_000 })
  })

  test('fills and submits form, redirects to event detail @visual', async ({ page }) => {
    await goto(page, '/ingest', '[data-testid="ingest-form"]')

    // Fill title
    await page.locator('[data-testid="input-title"]').fill(UNIQUE_TITLE)

    // Fill raw content
    await page.locator('[data-testid="input-raw-text"]').fill(UNIQUE_RAW)

    // Snapshot: filled form
    await matchSnapshot(page, 'ingest-form-filled', 'page', ['input[type="datetime-local"]'])

    // Submit
    await page.locator('[data-testid="submit-button"]').click()

    // Should redirect to the new event's detail page
    await page.waitForURL('**/events/**', { timeout: 20_000 })
    await expect(page.locator('[data-testid="event-detail-page"]')).toBeVisible()

    // Verify the created event title is shown
    await expect(page.locator('[data-testid="event-title"]')).toContainText(UNIQUE_TITLE)

    // Snapshot: post-submit event detail
    await matchSnapshot(page, 'ingest-form-post-submit', 'page', [
      'section:has(h2:text("Metadata"))',
      'div.flex.flex-wrap.items-center.gap-4',
    ])
  })
})
