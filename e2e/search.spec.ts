import { expect, test } from "@playwright/test";

// Global search: Ctrl+K opens it, a feature and a setting answer at once, a niche comes from the catalog index,
// and Enter opens the highlighted result.
const email = `e2e+search${Date.now()}@skillflow.test`;

test("global search finds features, settings, and niches, and opens one", async ({ page }) => {
  await page.goto("/signup");
  await page.locator('input[name="name"]').fill("E2E Searcher");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("e2e-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name: "Search SkillFlow" })).toBeVisible();
  await page.keyboard.press("Control+K");
  const dialog = page.getByRole("dialog", { name: "Search SkillFlow" });
  await expect(dialog).toBeVisible();
  const box = dialog.getByRole("combobox");
  await expect(box).toBeFocused();

  await box.fill("dark mode");
  await expect(dialog.getByRole("option", { name: /Theme and accent colour/ })).toBeVisible();

  // A quick action: the guided tour opens over Home.
  await box.fill("replay tour");
  await expect(dialog.getByRole("option", { name: /Replay the guided tour/ })).toBeVisible();
  await box.press("Enter");
  await expect(page.getByRole("dialog").getByText("Step 1 of 17")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.keyboard.press("Control+K");
  await expect(box).toBeFocused();
  await box.fill("chess");
  const niche = dialog.getByRole("option", { name: /^Chess\b.*Niches/ });
  await expect(niche).toBeVisible();
  await niche.hover();
  await box.press("Enter");
  await expect(page).toHaveURL(/\/roadmap\/chess$/);
  await expect(page.getByRole("dialog", { name: "Search SkillFlow" })).toHaveCount(0);
});
