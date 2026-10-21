import { chromium, expect, test } from "@playwright/test";

test("shows a text fallback when WebGL is unavailable", async ({ baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "one browser configuration is enough");
  const browser = await chromium.launch({ args: ["--disable-webgl", "--disable-3d-apis"] });
  const page = await browser.newPage();
  await page.goto(baseURL!);
  // Next.js also renders an empty route-announcer alert; target ours by its text.
  const alert = page.getByRole("alert").filter({ hasText: "3D view isn't available" });
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("Living Area");
  await browser.close();
});
