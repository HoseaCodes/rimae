import { type Page, expect } from '@playwright/test'

/**
 * Inject CSS that disables all transitions, animations, and scrollbar.
 * Call at the start of every test for visual stability.
 */
export async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
    `,
  })
}

/**
 * Navigate to a route and wait until the page is settled:
 * - networkidle (no pending requests)
 * - readySelector is visible (optional — proves data loaded)
 */
export async function goto(
  page: Page,
  path: string,
  readySelector?: string
) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  await disableAnimations(page)
  if (readySelector) {
    await expect(page.locator(readySelector)).toBeVisible({ timeout: 15_000 })
  }
}

/**
 * Take a scoped screenshot and assert it matches the stored snapshot.
 * @param page        Playwright page
 * @param name        Snapshot name (no extension — .png is added automatically)
 * @param selector    CSS selector or 'page' for full-page screenshot
 * @param maskSelectors  CSS selectors for regions to mask (e.g. date text)
 */
export async function matchSnapshot(
  page: Page,
  name: string,
  selector: string | 'page' = 'page',
  maskSelectors: string[] = []
) {
  const masks = maskSelectors.map((s) => page.locator(s))

  if (selector === 'page') {
    await expect(page).toHaveScreenshot(name + '.png', { mask: masks, fullPage: true })
  } else {
    const el = page.locator(selector)
    await expect(el).toHaveScreenshot(name + '.png', { mask: masks })
  }
}

/** Selectors for dynamic content that should be masked in snapshots */
export const MASK = {
  /** Any element containing relative time text like "3 days ago" */
  relativeTimes: '[class*="muted-foreground"]',
  /** The entire metadata table on event detail */
  metaTable: 'section:has(h2:text("Metadata"))',
  /** Stats counters that vary based on database state */
  statsGrid: '[data-testid="stats-grid"]',
}
