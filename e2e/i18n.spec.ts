import { expect, test } from "@playwright/test";

test.describe("Uzbek browser", () => {
  test.use({ locale: "uz-UZ" });

  test("the root redirects to Uzbek", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/uz$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "uz-Latn");
    await expect(page.getByRole("link", { name: "Roʻyxatimni tuzish" })).toBeVisible();
  });
});

test("switching language keeps answers and progress", async ({ page }) => {
  await page.goto("/en/questionnaire?flow=d2-extension");
  await page.getByRole("button", { name: /A degree course/ }).click();
  await expect(page).toHaveURL(/studyType=degree/);

  await page.getByRole("link", { name: "Oʻzbekcha" }).click();
  await expect(page).toHaveURL(/\/uz\/questionnaire\?.*studyType=degree/);
  await expect(page.getByRole("button", { name: /Darajali taʼlim/ })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: /^Ha/ }).click();
  await page.getByRole("button", { name: /Roʻyxatni tuzish/ }).click();
  await expect(page.getByRole("heading", { name: "Ushbu hujjatlarni tayyorlang" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pasport" })).toBeVisible();
  // Korean names are always shown, whatever the language.
  await expect(page.getByText("여권", { exact: true })).toBeVisible();
  await expect(page.getByText("Yashash muddatini uzaytirish yigʻimi")).toBeVisible();

  await page.getByRole("button", { name: "Pasport: tayyor deb belgilash" }).click();
  await expect(page.getByText("1/8 tayyor")).toBeVisible();

  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/checklist\?/);
  await expect(page.getByRole("heading", { name: "Passport" })).toBeVisible();
  await expect(page.getByText("1 of 8 ready")).toBeVisible();
});

test("a chosen language is remembered for links without one", async ({ page }) => {
  await page.goto("/en/start");
  await page.getByRole("link", { name: "Oʻzbekcha" }).click();
  await expect(page).toHaveURL(/\/uz\/start$/);
  await page.goto("/start");
  await expect(page).toHaveURL(/\/uz\/start$/);
  await expect(page.getByRole("heading", { name: "Nimaga tayyorlanyapsiz?" })).toBeVisible();
});

test("unknown language segments are not found", async ({ request }) => {
  const response = await request.get("/xx");
  expect(response.status()).toBe(404);
});
