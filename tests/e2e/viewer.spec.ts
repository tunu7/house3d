import { expect, type Page, test } from "@playwright/test";

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1280) < 768;

async function open(page: Page, query = "") {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`/${query}`);
  await expect(page.locator("canvas")).toBeVisible();
  // Loading overlay fades (and is hidden from assistive tech) once the first frames render.
  // A CSS locator is used because role queries ignore aria-hidden elements.
  await expect(page.locator('[role="status"]')).toHaveAttribute("aria-hidden", "true", { timeout: 30_000 });
  return errors;
}

test("renders without errors or horizontal overflow", async ({ page }) => {
  const errors = await open(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBe(0);
  expect(errors).toEqual([]);
});

test("stays within a draw-call budget", async ({ page }) => {
  await open(page, "?stats=1");
  await page.waitForFunction(() => window.__houseStats, null, { timeout: 20_000 });
  const stats = await page.evaluate(() => window.__houseStats!);
  expect(stats.calls).toBeLessThan(250);
});

test("selects a room from the list and shows its details", async ({ page }) => {
  await open(page);
  if (isMobile(page)) await page.getByRole("button", { name: "Rooms" }).click();
  await page.getByRole("button", { name: /^Kitchen/ }).click();
  if (isMobile(page)) {
    await expect(page.getByRole("button", { name: /Kitchen/ }).first()).toContainText("7.50 m²");
  } else {
    const details = page.getByRole("region", { name: "Kitchen details" });
    await expect(details).toContainText("2.5 m × 3 m");
    await expect(details).toContainText("7.50 m²");
  }
});

test("selects a room by clicking the model, and UI clicks do not select", async ({ page }) => {
  test.skip(isMobile(page), "canvas click positions are tuned for the desktop/tablet camera");
  await open(page);
  await page.getByRole("button", { name: "Ground" }).click();
  await page.waitForTimeout(1500);
  const box = (await page.locator("canvas").boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.58, box.y + box.height * 0.55);
  const details = page.getByRole("region", { name: /details$/ });
  await expect(details).toBeVisible();
  const before = await details.getAttribute("aria-label");
  await page.getByRole("button", { name: "Front" }).click();
  await expect(page.getByRole("region", { name: /details$/ })).toHaveAttribute("aria-label", before!);
});

test("view modes and toggles update the controls", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Cutaway" }).click();
  await expect(page.getByRole("button", { name: "Cutaway" })).toHaveAttribute("aria-pressed", "true");
  if (isMobile(page)) await page.getByRole("button", { name: "View options" }).click();
  await expect(page.getByRole("switch", { name: /Roof/ })).not.toBeChecked();
  await page.getByRole("switch", { name: "Exploded floors" }).check({ force: true });
  await expect(page.getByRole("switch", { name: "Exploded floors" })).toBeChecked();
});

test("walkthrough moves and exits", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: /^Walk(through)?$/ }).click();
  await expect(page.getByRole("button", { name: "Exit walk" })).toBeVisible();
  const forward = page.getByRole("button", { name: "Move forward" });
  const b = (await forward.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1200);
  await page.mouse.up();
  await expect(page.getByText("Living Area")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Exit walk" })).toBeHidden();
});
