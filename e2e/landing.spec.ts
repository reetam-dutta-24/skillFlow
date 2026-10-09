import { expect, test } from "@playwright/test";

test("landing page loads with the hero and a way to sign up", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/SkillFlow/);
  await expect(page.locator("#landing-hero-title")).toBeVisible();
  await expect(page.locator('a[href="/signup"]').first()).toBeVisible();
});

test("health check reports the database is up", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toMatchObject({ status: "ok", db: "ok" });
});
