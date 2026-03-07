import { test, expect } from '@playwright/test'
import { goto, matchSnapshot, disableAnimations } from '../helpers/navigation'

const ROUTES = [
  { path: '/',        label: 'Dashboard',   heading: 'VCTRL Knowledge Base', readyId: 'dashboard-page' },
  { path: '/explorer', label: 'Explorer',   heading: 'Event Explorer',       readyId: 'explorer-page' },
  { path: '/ingest',   label: 'Ingest',     heading: null,                    readyId: 'ingest-form' },
  { path: '/views',    label: 'Saved Views', heading: 'Saved Views',          readyId: 'views-page' },
] as const

test.describe('Navigation', () => {
  test('sidebar is present and stable on every route @visual', async ({ page }) => {
    for (const route of ROUTES) {
      await goto(page, route.path, '[data-testid="' + route.readyId + '"]')
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-explorer"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-ingest"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-views"]')).toBeVisible()
    }
  })

  test('sidebar nav links navigate correctly', async ({ page }) => {
    await goto(page, '/', '[data-testid="dashboard-page"]')

    // → Explorer
    await page.locator('[data-testid="nav-explorer"]').click()
    await page.waitForURL('**/explorer')
    await expect(page.locator('[data-testid="explorer-page"]')).toBeVisible()

    // → Ingest
    await page.locator('[data-testid="nav-ingest"]').click()
    await page.waitForURL('**/ingest')
    await expect(page.locator('[data-testid="ingest-form"]')).toBeVisible()

    // → Saved Views
    await page.locator('[data-testid="nav-views"]').click()
    await page.waitForURL('**/views')
    await expect(page.locator('[data-testid="views-page"]')).toBeVisible()

    // → Dashboard
    await page.locator('[data-testid="nav-dashboard"]').click()
    await page.waitForURL('/')
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible()
  })

  test('dashboard snapshot @visual', async ({ page }) => {
    await goto(page, '/', '[data-testid="dashboard-page"]')
    await matchSnapshot(page, 'nav-dashboard', '[data-testid="sidebar"]')
  })

  test('explorer route snapshot @visual', async ({ page }) => {
    await goto(page, '/explorer', '[data-testid="explorer-page"]')
    await matchSnapshot(page, 'nav-explorer', '[data-testid="sidebar"]')
  })

  test('ingest route snapshot @visual', async ({ page }) => {
    await goto(page, '/ingest', '[data-testid="ingest-form"]')
    await matchSnapshot(page, 'nav-ingest', '[data-testid="sidebar"]')
  })

  test('views route snapshot @visual', async ({ page }) => {
    await goto(page, '/views', '[data-testid="views-page"]')
    await matchSnapshot(page, 'nav-views', '[data-testid="sidebar"]')
  })

  test('active nav state is highlighted on each route @visual', async ({ page }) => {
    // Dashboard active
    await goto(page, '/', '[data-testid="dashboard-page"]')
    await matchSnapshot(page, 'sidebar-active-dashboard', '[data-testid="sidebar"]')

    // Explorer active
    await goto(page, '/explorer', '[data-testid="explorer-page"]')
    await matchSnapshot(page, 'sidebar-active-explorer', '[data-testid="sidebar"]')

    // Views active
    await goto(page, '/views', '[data-testid="views-page"]')
    await matchSnapshot(page, 'sidebar-active-views', '[data-testid="sidebar"]')
  })
})
