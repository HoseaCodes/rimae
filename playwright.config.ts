import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  snapshotDir: './tests/snapshots',
  outputDir: './tests/results',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'tests/report' }], ['list']],

  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1440, height: 1100 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixels: 300,
      animations: 'disabled',
      caret: 'hide',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1100 } },
    },
  ],

  webServer: {
    // In CI, PLAYWRIGHT_WEB_SERVER_COMMAND is set to `npm run start`
    // (production build). Locally it falls back to `npm run dev`.
    command: process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ?? 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stderr: 'pipe',
  },
})
