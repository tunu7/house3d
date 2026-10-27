/**
 * Renders the property-page gallery from the live 3D model, path traced.
 *
 *   npm run build && npm start -- -p 3123   (in another terminal)
 *   npm run render:gallery                  (BASE_URL=… to use another server)
 *
 * Each shot is the /explore viewer with all controls hidden (`ui=0`), in
 * photoreal render mode (`pt=1`), with a fixed camera and a time of day; the
 * shot is taken once the path tracer has accumulated the shot's sample count.
 * Needs a real GPU (headless Chromium uses it on macOS via Metal; software
 * rendering is far too slow to path trace). Output: public/gallery/<name>.jpg
 * at 1600 × 1000.
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3123";
const OUT = new URL("../public/gallery/", import.meta.url);
/** Path-tracing samples per shot: interiors need more (light arrives by bouncing). */
const EXTERIOR = 64;
const INTERIOR = 96;

/** name → [query, camera position, camera target, samples]. World metres; the front of the house faces +Z. */
const SHOTS = {
  "exterior-dusk": ["time=dusk", [-3, 2.8, 19], [0.6, 3.1, 0], EXTERIOR],
  "exterior-day": ["", [3, 3.2, 20], [-1, 3, 0], EXTERIOR],
  living: ["", [0.2, 1.55, 4.3], [-2.2, 1.4, -2.0], INTERIOR],
  "double-height": ["", [-3.0, 1.45, 4.0], [0.6, 4.3, 0.2], INTERIOR],
  kitchen: ["time=dusk", [0.6, 1.6, 0.6], [-3.6, 0.9, -2.6], INTERIOR],
  lounge: ["time=dusk", [2.0, 4.85, 2.0], [2.9, 4.3, 6.5], INTERIOR],
  bedroom: ["", [-3.7, 4.85, 0.1], [-0.1, 3.8, -2.2], INTERIOR],
  cutaway: ["time=dusk&cutaway=1", [-15, 15, 19], [0, 1.5, 0], EXTERIOR],
};

const only = process.argv.slice(2);
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({
  args: ["--enable-gpu", "--ignore-gpu-blocklist", ...(process.platform === "darwin" ? ["--use-angle=metal"] : [])],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
for (const [name, [query, cam, target, samples]] of Object.entries(SHOTS)) {
  if (only.length && !only.includes(name)) continue;
  const q = [query, "pt=1", "ui=0", `cam=${cam.join(",")}`, `target=${target.join(",")}`].filter(Boolean).join("&");
  await page.goto(`${BASE}/explore?${q}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("[role=status]")?.getAttribute("aria-hidden") === "true", null, {
    timeout: 120_000,
  });
  const started = Date.now();
  await page.waitForFunction((n) => (window.__ptSamples ?? 0) >= n, samples, { timeout: 1_800_000, polling: 1000 });
  // Let the fade-in finish.
  await page.waitForTimeout(1000);
  await page.locator("section").last().screenshot({ path: new URL(`${name}.jpg`, OUT).pathname, type: "jpeg", quality: 88 });
  console.log("rendered", name, `${samples} samples in ${Math.round((Date.now() - started) / 1000)} s`);
}
await browser.close();
