import { expect, test } from "@playwright/test";

test("homepage loads app shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "CommonGround" })).toBeVisible();
});
