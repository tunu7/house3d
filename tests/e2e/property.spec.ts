import { expect, test } from "@playwright/test";

test.describe("property page", () => {
  test("renders the showcase with figures from the model and no overflow", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Residence");
    const figures = page.getByRole("region", { name: "Key figures" });
    await expect(figures).toContainText("Bedrooms");
    await expect(figures).toContainText("131 m²");
    await expect(figures).toContainText("6.2 m");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
    expect(errors).toEqual([]);
  });

  test("floor plan switches floors and links a room to the 3D model", async ({ page }) => {
    await page.goto("/#plans");
    await page.getByRole("tab", { name: "First floor" }).click();
    await page.getByRole("button", { name: /^Balcony,/ }).click();
    await expect(page.getByRole("heading", { name: "Balcony", level: 3, exact: true })).toBeVisible();
    const link = page.getByRole("link", { name: "See it in 3D" });
    await expect(link).toHaveAttribute("href", "/explore?room=ff-balcony");
  });

  test("gallery opens a lightbox and steps through images", async ({ page }) => {
    await page.goto("/#gallery");
    await page.getByRole("button", { name: "Open image: Kitchen and dining" }).click();
    const dialog = page.getByRole("dialog", { name: "Image viewer" });
    await expect(dialog).toContainText("Kitchen and dining");
    await page.keyboard.press("ArrowRight");
    await expect(dialog).toContainText("First-floor lounge");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("deep link opens the 3D viewer on the chosen room", async ({ page }) => {
    await page.goto("/explore?room=gf-kitchen");
    await expect(page.locator("canvas")).toBeVisible({ timeout: 45_000 });
    if ((page.viewportSize()?.width ?? 1280) < 768) {
      await expect(page.getByRole("button", { name: /Kitchen/ }).first()).toContainText("7.50 m²");
    } else {
      await expect(page.getByRole("region", { name: "Kitchen details" })).toBeVisible();
    }
  });
});
