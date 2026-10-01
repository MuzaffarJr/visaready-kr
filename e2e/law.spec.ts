import { expect, test } from "@playwright/test";

test("Uzbek query finds the extension article with Korean and English text", async ({ page }) => {
  await page.goto("/law");
  await page.getByLabel("Search the Immigration Act").fill("viza muddatini uzaytirish");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(/q=viza/);
  const first = page.getByRole("article").first();
  await expect(first.getByRole("heading", { name: /Article 25 · Permission to Extend Period of Stay/ })).toBeVisible();
  await expect(first.getByText("체류기간이 끝나기 전에", { exact: false })).toBeVisible();
  await expect(page.getByText(/Version in force from 2016-09-30/)).toBeVisible();
});

test("article reference jumps to that article", async ({ page }) => {
  await page.goto("/law?q=" + encodeURIComponent("제46조"));
  const first = page.getByRole("article").first();
  await expect(first.getByRole("heading", { name: /Article 46 ·/ })).toBeVisible();
  await expect(first.getByText("Exact article", { exact: true })).toBeVisible();
});

test("unknown words show an empty state", async ({ page }) => {
  await page.goto("/law?q=zzzz");
  await expect(page.getByText(/No article matches/)).toBeVisible();
});
