import { expect, test } from "@playwright/test";

// Dopamine Detox end to end: a new learner takes the self-check, sees a Detox Score, explains one idea against the
// fake model in e2e/model-stub.mjs ("because" holds), and the "why it moved" breakdown changes.
const email = `e2e+detox${Date.now()}@skillflow.test`;
const password = "e2e-password-123";
const PATH_SLUG = "full-stack-web-dev";

test.setTimeout(240_000);

test("the Detox Score starts from the self-check and moves with a verified idea", async ({ page }) => {
  await page.goto("/signup");
  await page.locator('input[name="name"]').fill("E2E Detox");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  // 1. The self-check, one question per screen.
  await page.goto("/detox/check");
  await page.getByRole("button", { name: /Start the self-check/ }).click();
  for (let step = 0; step < 25; step += 1) {
    const heading = page.locator(".sf-dtx-q-title");
    const before = (await heading.innerText()).trim();
    const chips = page.locator(".sf-dtx-q-chips .sf-dtx-chip");
    const scale = page.locator(".sf-dtx-q-scale-option");
    if (await chips.count()) {
      await chips.first().click();
    } else if (await scale.count()) {
      await scale.nth(3).click();
    } else {
      await page.locator(".sf-dtx-q-option").first().click();
    }
    const next = page.getByRole("button", { name: /^(Next|See my score)$/ });
    const last = (await next.innerText()).includes("See my score");
    await next.click();
    if (last) break;
    await expect(heading).not.toHaveText(before);
  }

  // 2. A score, worked out in code, and nothing earned yet.
  await expect(page).toHaveURL(/\/detox$/, { timeout: 60_000 });
  await expect(page.getByRole("img", { name: /^Detox Score/ })).toBeVisible();
  await expect(page.getByText("This is a self-improvement score from your own answers and your learning activity, not a medical test.").first()).toBeVisible();
  const why = page.locator(".sf-dtx-why h2");
  await expect(why).toContainText("No change yet this week");

  // 3. One idea explained against the stub model.
  await page.goto(`/roadmap/${PATH_SLUG}`);
  await page.getByRole("link", { name: "Start stage" }).first().click();
  await expect(page).toHaveURL(/\/lesson\//);
  const stageId = new URL(page.url()).pathname.split("/").pop();
  await page.goto(`/milestone/${stageId}`);
  const idea = (await page.locator(".sf-explain-step h2").innerText()).trim();
  await page.locator("#explain-step").fill(`${idea} matters because it is what you use when you build the next part of the app.`);
  await page.getByRole("button", { name: /^Check (my explanation|it again)$/ }).click();
  await expect(page.getByText("This idea holds")).toBeVisible();

  // 4. The breakdown now names the verified idea.
  await page.goto("/detox");
  await expect(why).toContainText("1 idea passed");
  await expect(why).toContainText(/^\+\d+ this week/);
});
