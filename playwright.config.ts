import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  // Older full-tour acceptance files remain as historical evidence.
  testMatch: [
    '**/season-*.spec.ts',
    '**/tours.spec.ts',
    '**/farm-audio.spec.ts',
    '**/finalization-animation.spec.ts',
    '**/finalization-edge.spec.ts',
  ],
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'retain-on-failure', reducedMotion: 'reduce' },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
