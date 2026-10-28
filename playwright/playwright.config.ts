import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',

  testMatch: '**/*.spec.ts',

  fullyParallel: true,

  forbidOnly: isCI,

  retries: isCI ? 2 : 0,

  workers: isCI ? 2 : undefined,

  timeout: 30_000,

  expect: {
    timeout: 5_000
  },

  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: 'playwright-report',
        open: 'never'
      }
    ]
  ],

  outputDir: 'test-results',

  use: {
    baseURL: 'http://localhost:8080'
  },

  projects: [
    // API
    {
      name: 'API',

      testMatch: '**/api/**/*.spec.ts',

      use: {
        baseURL: 'http://localhost:8080'
      }
    },

    // UI
    {
      name: 'UI',

      testMatch: '**/ui/**/*.spec.ts',

      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        baseURL: process.env.PLAYWRIGHT_UI_BASE_URL || 'http://localhost:4200',

        headless: isCI,

        actionTimeout: 10_000,
        navigationTimeout: 20_000,

        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'on-first-retry',

        viewport: {
          width: 1440,
          height: 900
        },

        ignoreHTTPSErrors: false
      }
    },

    // E2E
    {
      name: 'E2E',

      testMatch: '**/e2e/**/*.spec.ts',

      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        baseURL: process.env.PLAYWRIGHT_UI_BASE_URL || 'http://localhost:4200',

        headless: isCI,

        actionTimeout: 10_000,
        navigationTimeout: 20_000,

        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'on-first-retry',

        viewport: {
          width: 1440,
          height: 900
        },

        ignoreHTTPSErrors: false
      }
    }
  ]
});