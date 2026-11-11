import { expect, test } from "@playwright/test";

// The explain-back gate, end to end, against the fake model in e2e/model-stub.mjs:
// an answer with "because" holds, anything else does not.
const email = `e2e+explain${Date.now()}@skillflow.test`;
const password = "e2e-password-123";
const PATH_SLUG = "full-stack-web-dev";

test.describe.configure({ mode: "serial" });
// The first visit compiles the pages in dev mode, and a stage can have many ideas.
test.setTimeout(240_000);

test("a learner explains every idea, a weak answer is held back, and the stage is recorded", async ({ page }) => {
  // A fresh learner, so stage 1 is open and nothing is passed yet.
  await page.goto("/signup");
  await page.locator('input[name="name"]').fill("E2E Explainer");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  // Find the first stage through the path page, then open its explain-back.
  await page.goto(`/roadmap/${PATH_SLUG}`);
  await page.getByRole("link", { name: "Start stage" }).first().click();
  await expect(page).toHaveURL(/\/lesson\//);
  const stageId = new URL(page.url()).pathname.split("/").pop();
  await page.goto(`/milestone/${stageId}`);
  await expect(page.getByRole("heading", { name: "Explain one idea at a time" })).toBeVisible();

  const field = page.locator("#explain-step");
  const idea = page.locator(".sf-explain-step h2");
  const check = page.getByRole("button", { name: /^Check (my explanation|it again)$/ });

  // 1. A thin answer does not move the step, and nothing lets the learner skip ahead.
  const firstIdea = (await idea.innerText()).trim();
  await field.fill("It is a thing.");
  await check.click();
  await expect(page.getByText("Stay with this idea")).toBeVisible();
  await expect(page.getByRole("button", { name: /^(Next idea|Finish this stage)$/ })).toHaveCount(0);
  await expect(idea).toHaveText(firstIdea);

  // 2. Every idea, explained properly, holds and moves on.
  for (let step = 0; step < 40; step += 1) {
    const current = (await idea.innerText()).trim();
    await field.fill(`${current} matters because it is what you use when you build the next part of the app.`);
    await check.click();
    await expect(page.getByText("This idea holds")).toBeVisible();

    // Full-Stack is a practical path, so the last idea leads to the hands-on step.
    const toWork = page.getByRole("button", { name: "Next: show your work" });
    if (await toWork.isVisible()) {
      await toWork.click();
      break;
    }
    await page.getByRole("button", { name: "Next idea" }).click();
    await expect(idea).not.toHaveText(current);
  }

  // 3. Hands-on work: a write-up that is too short is held back in the browser; a real one is reviewed and accepted.
  await expect(page.getByRole("heading", { name: "Show one small piece of real work" })).toBeVisible();
  await page.getByLabel("A link").check();
  // A video link is not fetched, so the test never depends on an outside site.
  await page.locator("#proof-link").fill("https://youtu.be/e2e-skillflow-demo");
  const writeUp = page.locator("#proof-writeup");
  await writeUp.fill("I built a page.");
  await page.getByRole("button", { name: "Check my work" }).click();
  await expect(page.getByText(/at least 40 words/)).toBeVisible();
  await writeUp.fill(
    "I built a tiny page with a heading, a list of three links, and a button that changes the background colour. " +
      "The button did nothing at first because I loaded the script before the button existed, so I moved the script tag " +
      "to the end of the body and it worked. Then I checked it on my phone and fixed the font size.",
  );
  await page.getByRole("button", { name: "Check my work" }).click();
  await expect(page.getByText("Your work holds")).toBeVisible();
  await page.getByRole("button", { name: "Finish this stage" }).click();

  // 4. The stage is recorded, and the accepted ideas are in Notes.
  await expect(page.getByRole("heading", { name: "You explained this stage" })).toBeVisible();
  await page.goto("/notes");
  await expect(page.getByText(firstIdea).first()).toBeVisible();
});