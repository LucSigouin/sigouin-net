import { defineConfig, devices } from '@playwright/test';

// On a Mac the headless browser can use the real GPU (Metal); elsewhere, or with HUB_GPU=0,
// it falls back to SwiftShader, which is slow but still exercises every code path.
const gpu = process.platform === 'darwin' && process.env.HUB_GPU !== '0';
const args = gpu
  ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']
  : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

export default defineConfig({
  testDir: 'tests',
  timeout: 300_000,
  expect: { timeout: 30_000 },
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5191', launchOptions: { args } },
  // SITE_URL runs read-only against that site: no local build, nothing written to dist/.
  webServer: process.env.SITE_URL ? undefined : {
    command: 'npm run build && npx vite preview --port 5191 --strictPort',
    url: 'http://localhost:5191',
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    { name: 'desktop', grep: /@desktop/, use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', grep: /@mobile/, use: { ...devices['Pixel 7'] } },
  ],
});
