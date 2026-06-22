const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/load',
  fullyParallel: true,
  workers: 10,
  timeout: 120000,
  expect: {
    timeout: 15000,
  },
  reporter: [
    ['list'],
    ['./tests/load-reporter.cjs'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: process.env.VELORA_LOAD_TEST_URL || 'https://velora-tracker.vercel.app',
    headless: true,
    navigationTimeout: 30000,
    actionTimeout: 15000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
