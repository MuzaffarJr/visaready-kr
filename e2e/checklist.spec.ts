import { expect, test } from "@playwright/test";

test("landing to checklist happy path", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /start/i }).first().click();
  await expect(page).toHaveURL(/\/start$/);

  await page.getByRole("link", { name: /D-2 Extension/ }).click();
  await expect(page).toHaveURL(/flow=d2-extension/);

  const generate = page.getByRole("button", { name: /Generate checklist/ });
  await expect(generate).toBeDisabled();
  await page.getByRole("button", { name: /^Yes/ }).click();
  await generate.click();

  await expect(page.getByRole("heading", { name: "Prepare these documents" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Address Change Supporting Document" })).toBeVisible();
  await expect(page.getByText(/Provisional checklist/)).toBeVisible();

  await page.getByRole("button", { name: "Mark Passport ready" }).click();
  await expect(page.getByText(/1 of 7 ready/)).toBeVisible();
});

test("conditional requirement is omitted when it does not apply", async ({ page }) => {
  await page.goto("/checklist?flow=d10-extension&addressChanged=false");
  await expect(page.getByRole("heading", { name: "Job-Seeking Activity Evidence" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Address Change Supporting Document" })).toHaveCount(0);
});

test("invalid answers never produce a checklist", async ({ page }) => {
  await page.goto("/checklist?flow=d2-extension&addressChanged=maybe");
  await expect(page.getByText(/answers are missing or invalid/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Prepare these documents" })).toHaveCount(0);
});
