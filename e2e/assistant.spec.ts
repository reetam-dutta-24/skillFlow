import { execSync } from "node:child_process";
import { expect, test } from "@playwright/test";

// The SkillFlow Assistant, end to end, against the fake model and embedder in e2e/model-stub.mjs: Ctrl+J opens it,
// a help question streams an answer with a source chip, an un-passed explain-back idea gets hint mode, and a rate
// limit shows its calm message.
const email = `e2e+assistant${Date.now()}@skillflow.test`;

test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

test.beforeAll(() => {
  // The retrieval index must exist. Build it only when the table is empty, so a real index is never replaced.
  execSync("npm run assistant:index -- --if-empty --delay=0", {
    stdio: "inherit",
    env: { ...process.env, ASSISTANT_EMBED_URL: "http://localhost:4010/v1/embeddings", EXPLAIN_MODEL_KEY: "e2e-stub" },
  });
});

test("the assistant answers with sources, gives hints for an un-passed idea, and explains a rate limit", async ({ page }) => {
  await page.goto("/signup");
  await page.locator('input[name="name"]').fill("E2E Asker");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("e2e-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name: /Ask SkillFlow/ })).toBeVisible();
  await page.keyboard.press("Control+J");
  const dialog = page.getByRole("dialog", { name: "Ask SkillFlow" });
  await expect(dialog).toBeVisible();
  const box = dialog.getByLabel("Your question");
  await expect(box).toBeFocused();
  await expect(dialog.getByRole("button", { name: "How does explain-back decide I passed?" })).toBeVisible();

  // 1. A help question: the answer streams in, then the verified text shows a numbered source chip and a source list.
  await box.fill("How does explain-back decide I passed?");
  await box.press("Enter");
  await expect(dialog.getByText("You asked:", { exact: false })).toBeAttached();
  const chip = dialog.getByRole("button", { name: /^Source 1: / }).first();
  await expect(chip).toBeVisible();
  await expect(dialog.getByText("Sources", { exact: true }).first()).toBeVisible();
  await chip.click();

  // 2. An explain-back idea in a stage this new learner has not passed: hint mode, never the explanation.
  await box.fill("Explain how the knight moves in chess");
  await box.press("Enter");
  await expect(dialog.getByText("Hint mode — you’ll explain this one yourself")).toBeVisible();
  await expect(dialog.getByRole("button", { name: /^Source 1: / })).toHaveCount(2);

  // 3. Escape closes and the chat survives for the session; Clear chat empties it.
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: /Ask SkillFlow/ }).click();
  await expect(page.getByRole("dialog", { name: "Ask SkillFlow" }).getByText("Hint mode — you’ll explain this one yourself")).toBeVisible();
  await page.getByRole("button", { name: "Clear chat" }).click();
  await expect(page.getByRole("button", { name: "What should I do next?" })).toBeVisible();

  // 4. The rate-limit message. Tests run without Redis (limits off), so the server's 429 is simulated here.
  await page.route("**/api/assistant", (route) =>
    route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ t: "error", code: "rate-limit", message: "" }) }),
  );
  const again = page.getByRole("dialog", { name: "Ask SkillFlow" }).getByLabel("Your question");
  await again.fill("What should I do next?");
  await again.press("Enter");
  await expect(page.getByRole("alert").filter({ hasText: "You have asked a lot in a short time" })).toBeVisible();
});

test("Ask the assistant opens from the Ctrl+K palette", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("e2e-password-123");
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await page.waitForURL(/\/(dashboard|onboarding)/);
  await page.goto("/dashboard");
  await page.keyboard.press("Control+K");
  const search = page.getByRole("dialog", { name: "Search SkillFlow" });
  await search.getByRole("combobox").fill("ask assistant");
  await expect(search.getByRole("option", { name: /Ask the assistant/ })).toBeVisible();
  await search.getByRole("combobox").press("Enter");
  await expect(page.getByRole("dialog", { name: "Ask SkillFlow" })).toBeVisible();
});
