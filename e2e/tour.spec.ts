import { expect, test } from "@playwright/test";

// The Home product tour: a new learner opens it, passes the explain-back practice, finishes, and Home remembers.
const email = `e2e+tour${Date.now()}@skillflow.test`;
const password = "e2e-password-123";

test("a new learner takes the tour and Home then offers a replay", async ({ page }) => {
  await page.goto("/signup");
  await page.locator('input[name="name"]').fill("E2E Tourist");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  // The tour never opens by itself; Home shows the invite.
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "New here? Take the guided tour" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Start the tour" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Step 1 of 17")).toBeVisible();

  // Next four times, to the explain-back slide: niches, paths, lessons, then explain-back.
  for (let i = 0; i < 4; i += 1) await dialog.getByRole("button", { name: "Next", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "Explain each idea in your own words" })).toBeVisible();

  // A thin answer stays on the idea; one with a reason holds and opens the next stage.
  const field = dialog.getByLabel("Explain it in your own words");
  await field.fill("It is a box.");
  await dialog.getByRole("button", { name: "Check my explanation" }).click();
  await expect(dialog.getByText("Stay with this idea")).toBeVisible();
  await field.fill("A variable is a name for a value, so you can store it once and use it again later.");
  await dialog.getByRole("button", { name: "Check it again" }).click();
  await expect(dialog.getByText("This idea holds")).toBeVisible();
  await expect(dialog.getByText("Open", { exact: true })).toBeVisible();

  // Jump to the last step and finish without leaving Home.
  await dialog.getByRole("button", { name: "Step 17 of 17: Start" }).click();
  await dialog.getByRole("button", { name: "Finish and stay on Home" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Replay the tour" })).toBeVisible();

  // Saved on the profile, so it survives a reload.
  await page.reload();
  await expect(page.getByRole("button", { name: "Replay the tour" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start the tour" })).toHaveCount(0);

  // The replay works by keyboard: arrows move, Escape closes, focus comes back to the link.
  const replay = page.getByRole("button", { name: "Replay the tour" });
  await replay.click();
  await expect(page.getByRole("dialog").getByText("Step 1 of 17")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog").getByText("Step 2 of 17")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(replay).toBeFocused();
});
