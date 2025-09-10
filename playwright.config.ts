import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for BarberPro E2E Testing
 * Optimized for Argentina market requirements and mobile-first approach
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:5173',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Argentina timezone for accurate testing */
    timezoneId: 'America/Argentina/Buenos_Aires',
    
    /* Argentina locale */
    locale: 'es-AR',
  },

  /* Configure projects for major browsers and devices */
  projects: [
    /* Desktop Browsers - Argentina Market Focus */
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 }
      },
    },
    
    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1440, height: 900 }
      },
    },
    
    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1440, height: 900 }
      },
    },

    /* Mobile Testing - Priority for 80% mobile traffic */
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        // Simulate 3G connection for Argentina network conditions
        // launchOptions: {
        //   args: ['--enable-features=NetworkService,NetworkServiceLogging'],
        // }
      },
    },
    
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    
    {
      name: 'mobile-samsung',
      use: { 
        ...devices['Galaxy S9+'],
        // Additional Samsung-specific testing
      },
    },

    /* Tablet Testing */
    {
      name: 'tablet-ipad',
      use: { ...devices['iPad Pro'] },
    },

    /* Network Condition Testing for Argentina */
    {
      name: 'slow-3g-mobile',
      use: {
        ...devices['Pixel 5'],
        // Simulate slow 3G conditions common in Argentina
        launchOptions: {
          args: ['--enable-features=NetworkService,NetworkServiceLogging'],
        }
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'npm run backend',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test'
      }
    },
    {
      command: 'npm run frontend',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test'
      }
    }
  ],

  /* Global timeout for tests */
  timeout: 30000,
  
  /* Global timeout for expect assertions */
  expect: {
    timeout: 5000
  },

  /* Test output directory */
  outputDir: 'test-results/',
});