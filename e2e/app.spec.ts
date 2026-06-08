import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Core user-flow end-to-end tests plus automated accessibility scans.
 *
 * The app persists to localStorage. We clear it once on the first load of each
 * test (guarded by a sessionStorage sentinel) so a clean slate does not also
 * wipe data across an in-test reload.
 *
 * Information architecture:
 *   /            marketing landing page
 *   /app         dashboard
 *   /app/log     log an activity + history
 *   /app/insights ranked guidance
 *   /app/assistant AI chat
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("e2e-init")) {
      window.localStorage.clear();
      sessionStorage.setItem("e2e-init", "1");
    }
  });
});

test("landing page loads with its hero heading", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /understand your footprint/i }),
  ).toBeVisible();
});

test("landing page links through to the app", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /start tracking/i }).first().click();
  await expect(
    page.getByRole("heading", { level: 1, name: /footprint at a glance/i }),
  ).toBeVisible();
});

test("dashboard shows the empty state before anything is logged", async ({
  page,
}) => {
  await page.goto("/app");
  await expect(
    page.getByRole("heading", { level: 1, name: /footprint at a glance/i }),
  ).toBeVisible();
  await expect(page.getByText(/nothing logged yet/i)).toBeVisible();
});

test("a user can log an activity and see it reflected", async ({ page }) => {
  await page.goto("/app/log");

  // Default selected activity is the first option (petrol car). Log 40 km.
  await page.getByLabel(/amount/i).fill("40");
  await page.getByRole("button", { name: /add to log/i }).click();

  // It shows up in the logged-activities list...
  const logged = page.getByRole("list", { name: /logged activities/i });
  await expect(logged.getByText(/petrol car/i)).toBeVisible();

  // ...and the dashboard now renders the breakdown table.
  await page.goto("/app");
  await expect(
    page.getByRole("table", { name: /by category/i }),
  ).toBeVisible();

  // ...and an insight headline appears on the insights page.
  await page.goto("/app/insights");
  await expect(
    page
      .getByRole("list", { name: /personalized insights/i })
      .getByRole("listitem")
      .first(),
  ).toBeVisible();
});

test("logged data persists across reloads", async ({ page }) => {
  await page.goto("/app/log");
  await page.getByLabel(/amount/i).fill("25");
  await page.getByRole("button", { name: /add to log/i }).click();

  const logged = page.getByRole("list", { name: /logged activities/i });
  await expect(logged.getByText(/petrol car/i)).toBeVisible();

  await page.reload();

  await expect(
    page.getByRole("list", { name: /logged activities/i }).getByText(/petrol car/i),
  ).toBeVisible();
});

test("a user can remove a logged activity", async ({ page }) => {
  await page.goto("/app/log");
  await page.getByLabel(/amount/i).fill("10");
  await page.getByRole("button", { name: /add to log/i }).click();

  await expect(
    page.getByRole("list", { name: /logged activities/i }).getByText(/petrol car/i),
  ).toBeVisible();

  await page.getByRole("button", { name: /remove petrol car/i }).first().click();

  await expect(page.getByText(/no activities logged yet/i)).toBeVisible();
});

test("landing page has no detectable accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("heading", { level: 1 }).waitFor();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("the dashboard empty state has no accessibility violations", async ({
  page,
}) => {
  await page.goto("/app");
  await page.getByRole("heading", { level: 1 }).waitFor();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("the log page has no accessibility violations", async ({ page }) => {
  await page.goto("/app/log");
  await page.getByRole("heading", { level: 1 }).waitFor();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("the dashboard with logged data has no accessibility violations", async ({
  page,
}) => {
  await page.goto("/app/log");
  await page.getByLabel(/amount/i).fill("40");
  await page.getByRole("button", { name: /add to log/i }).click();
  await expect(
    page.getByRole("list", { name: /logged activities/i }).getByText(/petrol car/i),
  ).toBeVisible();

  await page.goto("/app");
  await expect(page.getByRole("table", { name: /by category/i })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
