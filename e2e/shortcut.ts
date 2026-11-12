import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Presses a keyboard shortcut until `opens` is visible. The top-bar buttons are server-rendered, so they show before
 * React hydrates, but the window key listeners are added only after hydration; in dev mode, under load, a press in
 * that gap is lost. It presses only while `opens` is hidden, so a shortcut that toggles (Ctrl+J) is never closed again.
 */
export async function pressUntilOpen(page: Page, key: string, opens: Locator) {
  await expect(async () => {
    if (!(await opens.isVisible())) await page.keyboard.press(key);
    await expect(opens).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}
