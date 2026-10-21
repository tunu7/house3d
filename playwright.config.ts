import { defineConfig, devices } from "@playwright/test";

const PORT = 3123;
/** Software WebGL so tests run on machines and CI runners without a GPU. */
const swiftshader = { launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } };

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, ...swiftshader },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, ...swiftshader } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, hasTouch: true, ...swiftshader } },
    { name: "mobile", use: { ...devices["Pixel 7"], ...swiftshader } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
