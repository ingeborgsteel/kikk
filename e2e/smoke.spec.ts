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
  const dismissedAlerts = JSON.stringify({
    "e2e-guest": featureAlerts.map((alert) => alert.id),
  });
  await page.addInitScript(`
    localStorage.clear();
    localStorage.setItem("kikk-guest-user-id", "e2e-guest");
    localStorage.setItem("kikk_dismissed_feature_alerts", '${dismissedAlerts}');
  `);
  await page.goto(`/?${resetKey}`);
});

test("loads the map view", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "kikk" })).toBeVisible();
  await expect(page.locator(".leaflet-container")).toBeVisible();
});

test("navigates between main views", async ({ page }) => {
  // Quick-access icon button in the header.
  await page.getByRole("button", { name: "Kikket på" }).click();
  await expect(page.getByRole("heading", { name: /kikket på/i })).toBeVisible();
  await expect(page.getByText("Ingen observasjoner ennå")).toBeVisible();

  // Header title navigates back to the map.
  await page.locator("h1").getByRole("button").click();
  await expect(page.locator(".leaflet-container")).toBeVisible();

  await page.getByRole("button", { name: "Meny" }).click();
  await page.getByRole("button", { name: /Statistikk/i }).click();
  await expect(
    page.getByRole("heading", { name: /statistikk/i }),
  ).toBeVisible();
  await expect(page.getByText("Ingen observasjoner ennå")).toBeVisible();
});

test("mobile: headerless map with floating kikkemodus button", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  // No header on mobile — the map is full-screen.
  await expect(page.locator("header")).toBeHidden();
  await expect(page.locator(".leaflet-container")).toBeVisible();

  // Kikkemodus is a floating glass button above the layer switcher.
  const kikkemodus = page.getByRole("button", { name: "Kikkemodus" });
  await expect(kikkemodus).toBeVisible();
  await kikkemodus.click();
  await expect(kikkemodus).toHaveAttribute("aria-pressed", "true");

  // With kikkemodus active, a map tap goes straight to the observation form.
  await page
    .locator(".leaflet-container")
    .click({ position: { x: 200, y: 300 } });
  await expect(page.getByText("Opprett kikk")).toBeVisible();
});

test("zooming the map disables follow mode", async ({ page, context }) => {
  const map = page.locator(".leaflet-container");
  await map.waitFor();

  // Geolocation is denied by default in tests, which also disables follow
  // mode — grant it with a mock position, then enable follow manually.
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 59.9139, longitude: 10.7522 });
  const follow = page.getByRole("button", { name: "Følg meg" });
  await follow.click();
  await expect(follow).toHaveAttribute("aria-pressed", "true");

  // A user-initiated wheel zoom drops follow mode — a single tap on the
  // button then recenters instead of toggling off first.
  await map.hover({ position: { x: 300, y: 300 } });
  await page.mouse.wheel(0, -240);
  await expect(follow).toHaveAttribute("aria-pressed", "false");
});

test("opens the new observation form from the map", async ({ page }) => {
  const map = page.locator(".leaflet-container");
  await map.waitFor();

  await map.click({ position: { x: 100, y: 100 } });

  await expect(page.getByText("Hva vil du gjøre?")).toBeVisible();
  await page.getByRole("button", { name: "Legg til observasjon" }).click();

  await expect(page.getByText("Opprett kikk")).toBeVisible();

  await page.getByLabel("Søk etter art").fill("Gråspurv");
  await page.getByLabel("Søk etter art").press("Enter");

  await expect(page.getByText("Gråspurv")).toBeVisible();

  await page.getByRole("button", { name: "Avbryt" }).click();
  await expect(page.getByText("Opprett kikk")).not.toBeVisible();
});
