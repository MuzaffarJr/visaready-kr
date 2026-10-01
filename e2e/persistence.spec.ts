import { expect, test } from "@playwright/test";

const url = "/checklist?flow=d2-extension&studyType=degree&thesisStage=false";

test("progress survives a reload and can be resumed without answers", async ({ page }) => {
  await page.goto(url);
  await page.getByRole("button", { name: "Mark Passport ready" }).click();
  await expect(page.getByText("1 of 7 ready")).toBeVisible();

  await page.reload();
  await expect(page.getByText("1 of 7 ready")).toBeVisible();

  await page.goto("/checklist?flow=d2-extension");
  await expect(page.getByText("1 of 7 ready")).toBeVisible();
});

test("a checklist from older rules is not rewritten until the user accepts", async ({ page }) => {
  await page.goto(url);
  await page.getByRole("button", { name: "Mark Passport ready" }).click();

  // Simulate a checklist created under an older rule set version that lacked the transcript.
  await page.evaluate(() => {
    const key = "visaready:checklist:d2-extension";
    const saved = JSON.parse(localStorage.getItem(key)!);
    saved.snapshot.ruleSetVersion = 0;
    saved.snapshot.items = saved.snapshot.items.filter(
      (item: { requirementId: string }) => item.requirementId !== "transcript",
    );
    localStorage.setItem(key, JSON.stringify(saved));
  });

  await page.reload();
  await expect(page.getByText(/Rules updated to v2/)).toBeVisible();
  await expect(page.getByText("1 of 6 ready")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Academic Transcript" })).toHaveCount(0);

  await page.getByRole("button", { name: "Update my checklist" }).click();
  await expect(page.getByRole("heading", { name: "Academic Transcript" })).toBeVisible();
  await expect(page.getByText("1 of 7 ready")).toBeVisible();
  await expect(page.getByText(/Rules updated/)).toHaveCount(0);
});
