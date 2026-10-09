import { expect, test, type Page } from "@playwright/test";

// One new learner per run. The tests run in order and share these details.
const email = `e2e+${Date.now()}@skillflow.test`;
const password = "e2e-password-123";
const PATH_SLUG = "full-stack-web-dev";

test.describe.configure({ mode: "serial" });

async function logIn(page: Page, pass: string) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(pass);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
}

test("a new learner signs up and lands on onboarding", async ({ page }) => {
  await page.goto("/signup");
  await page.locator('input[name="name"]').fill("E2E Learner");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/onboarding/);
});

test("a wrong password shows an error and stays on login", async ({ page }) => {
  await logIn(page, "not-the-password");

  await expect(page.getByText("Invalid email or password")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("a learner logs in, opens a path and starts the first stage", async ({ page }) => {
  await logIn(page, password);
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto(`/roadmap/${PATH_SLUG}`);
  await page.getByRole("link", { name: "Start stage" }).first().click();

  await expect(page).toHaveURL(/\/lesson\//);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explain it back" })).toBeVisible();
});

test("signed-out visitors are sent to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
