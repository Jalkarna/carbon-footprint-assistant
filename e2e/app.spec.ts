import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Core user-flow end-to-end tests plus automated accessibility scans.
 *
 * The app persists to localStorage. We clear it once on the first load of each
 * test (guarded by a sessionStorage sentinel) so a clean slate does not also
 * wipe data across an in-test reload.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("e2e-init")) {
      window.localStorage.clear();
      sessionStorage.setItem("e2e-init", "1");
    }
  });
});

test("dashboard loads with the main heading", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /carbon footprint/i }),
  ).toBeVisible();
});

test("a user can log an activity and see it reflected", async ({ page }) => {
  await page.goto("/");

  // Log 40 km in a petrol car (the first option).
  await page.getByLabel(/amount/i).fill("40");
  await page.getByRole("button", { name: /add to log/i }).click();

  // It shows up in the recent activities list...
  const recent = page.getByRole("list", { name: /recent activities/i });
  await expect(recent.getByText(/petrol car/i)).toBeVisible();

  // ...and the breakdown table now renders.
  await expect(page.getByRole("table", { name: /by category/i })).toBeVisible();

  // ...and an insight headline appears.
  await expect(
    page.getByRole("list", { name: /insights/i }).getByRole("listitem").first(),
  ).toBeVisible();
});

test("logged data persists across reloads", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/amount/i).fill("25");
  await page.getByRole("button", { name: /add to log/i }).click();

  await expect(
    page.getByRole("list", { name: /recent activities/i }).getByText(/petrol car/i),
  ).toBeVisible();

  await page.reload();

  await expect(
    page.getByRole("list", { name: /recent activities/i }).getByText(/petrol car/i),
  ).toBeVisible();
});

test("a user can remove a logged activity", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/amount/i).fill("10");
  await page.getByRole("button", { name: /add to log/i }).click();

  await page.getByRole("button", { name: /remove petrol car/i }).click();

  await expect(
    page.getByText(/no activities logged yet/i),
  ).toBeVisible();
});

test("homepage has no detectable accessibility violations (empty state)", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("heading", { level: 1 }).waitFor();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("dashboard has no accessibility violations with logged data", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel(/amount/i).fill("40");
  await page.getByRole("button", { name: /add to log/i }).click();
  await expect(page.getByRole("table", { name: /by category/i })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
