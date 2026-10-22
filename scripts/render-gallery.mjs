/**
 * Renders the property-page gallery from the live 3D model.
 *
 *   npm run build && npm start -- -p 3123   (in another terminal)
 *   npm run render:gallery
 *
 * Each shot is the /explore viewer with all controls hidden (`ui=0`), a fixed
 * camera and a time of day. Output: public/gallery/<name>.jpg at 1600 × 1000.
 */
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3123";
const OUT = new URL("../public/gallery/", import.meta.url);

/** name → [query, camera position, camera target]. World metres; the front of the house faces +Z. */
const SHOTS = {
  "exterior-dusk": ["time=dusk", [5.5, 3.0, 17.5], [-0.3, 3.2, 0]],
  "exterior-day": ["", [14, 7, 15], [0, 3, 0]],
  living: ["", [-0.2, 1.55, 4.3], [2.2, 1.4, -2.0]],
  "double-height": ["", [3.0, 1.45, 4.0], [-0.6, 4.3, 0.2]],
  kitchen: ["time=dusk", [-0.6, 1.6, 0.6], [3.6, 0.9, -2.6]],
  lounge: ["time=dusk", [-2.0, 4.85, 2.0], [-2.9, 4.3, 6.5]],
  bedroom: ["", [3.7, 4.85, 0.1], [0.1, 3.8, -2.2]],
  cutaway: ["time=dusk&cutaway=1", [13, 10, 14], [0, 2.5, 0]],
};

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
for (const [name, [query, cam, target]] of Object.entries(SHOTS)) {
  const q = [query, "ui=0", `cam=${cam.join(",")}`, `target=${target.join(",")}`].filter(Boolean).join("&");
  await page.goto(`${BASE}/explore?${q}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("[role=status]")?.getAttribute("aria-hidden") === "true", null, {
    timeout: 120_000,
  });
  await page.waitForTimeout(5000);
  await page.locator("section").last().screenshot({ path: new URL(`${name}.jpg`, OUT).pathname, type: "jpeg", quality: 86, timeout: 120_000 });
  console.log("rendered", name);
}
await browser.close();
