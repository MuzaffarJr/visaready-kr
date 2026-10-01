import { expect, test } from "@playwright/test";

test("pages send security headers", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("happy path runs without CSP violations or console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/questionnaire?flow=d2-to-d10");
  await page.getByRole("button", { name: /^No/ }).click();
  await page.getByRole("button", { name: /Generate checklist/ }).click();
  await expect(page.getByRole("heading", { name: "Prepare these documents" })).toBeVisible();
  expect(errors).toEqual([]);
});
