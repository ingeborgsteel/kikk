import { test, expect } from "@playwright/test";
import { featureAlerts } from "../src/react-app/data/featureAlerts";

test.beforeEach(async ({ page }) => {
  await page.route("https://nominatim.openstreetmap.org/reverse**", (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({ address: {} }),
    }),
  );

  await page.route(
    "https://artskart.artsdatabanken.no/publicapi/api/taxon**",
    (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify([]),
      }),
  );

  await page.route("https://cache.kartverket.no/**", (route) =>
    route.fulfill({ status: 200, body: "" }),
  );
  await page.route("https://api.mapbox.com/**", (route) =>
    route.fulfill({ status: 200, body: "" }),
  );

  // Mock backend user access so guest smoke tests don't hit unseeded data.
  await page.route("**/api/user-accesses**", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({}) }),
  );

  const resetKey = `__e2e_reset=${Date.now()}`;
  // Only clear localStorage on the first navigation — the init script re-runs
  // on reloads, and we want dismissal state to survive a reload in the tests.
  await page.addInitScript(`
    if (!sessionStorage.getItem("__e2e_init")) {
      localStorage.clear();
      sessionStorage.setItem("__e2e_init", "1");
    }
    localStorage.setItem("kikk-guest-user-id", "e2e-guest");
  `);
  await page.goto(`/?${resetKey}`);
});

test("shows the feature alert modal once and keeps it dismissed", async ({
  page,
}) => {
  const modalTitle = page.getByRole("heading", { name: "Nytt i kikk" });
  await expect(modalTitle).toBeVisible();
  await expect(page.getByText(featureAlerts[0].title)).toBeVisible();

  await page.getByRole("button", { name: "Skjønner!" }).click();
  await expect(modalTitle).not.toBeVisible();

  // Reload — the modal must not come back for the same user.
  await page.goto("/");
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(modalTitle).not.toBeVisible();
});

test("lists all alerts in the /news archive", async ({ page }) => {
  await page.getByRole("button", { name: "Skjønner!" }).click();

  await page.goto("/news");
  await expect(
    page.getByRole("heading", { name: "nyheter", exact: true }),
  ).toBeVisible();
  for (const alert of featureAlerts) {
    await expect(page.getByText(alert.title)).toBeVisible();
  }
});

test("mobile bottom nav opens the /menu page with all options", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Skjønner!" }).click();
  await page.setViewportSize({ width: 390, height: 844 });

  // Clicking outside collapses the pill to the round current-page button.
  await page.locator("header").click({ position: { x: 200, y: 45 } });
  await expect(page.locator("nav > div").first()).toHaveCSS("width", "48px");

  // Tapping it expands again — clicking a nav item keeps the pill open.
  await page.getByRole("button", { name: "Vis meny" }).click();
  await page
    .locator("nav")
    .getByRole("button", { name: "Meny", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "meny" })).toBeVisible();
  await expect(page.locator("nav > div").first()).not.toHaveCSS(
    "width",
    "48px",
  );
  for (const label of [
    "Kart",
    "Kikket på",
    "Statistikk",
    "Nyheter",
    "Profil",
    "Logg ut",
  ]) {
    await expect(
      page.getByRole("button", { name: label, exact: true }),
    ).toBeVisible();
  }

  await page.getByRole("button", { name: "Statistikk", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /statistikk/i }),
  ).toBeVisible();
});

test("new users do not see alerts that predate them", async ({ page }) => {
  // Guest created "tomorrow" — all current alerts predate their start date.
  await page.evaluate(() => {
    localStorage.setItem("kikk-guest-created-at", "2999-01-01");
  });
  await page.reload();

  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Nytt i kikk" }),
  ).not.toBeVisible();

  // The archive still lists the alerts, but without "Ny" badges.
  await page.goto("/news");
  await expect(
    page.getByRole("heading", { name: "nyheter", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Ny", { exact: true })).not.toBeVisible();
});
