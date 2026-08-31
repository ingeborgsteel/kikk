import { test, expect } from "@playwright/test";

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

  const resetKey = `__e2e_reset=${Date.now()}`;
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto(`/?${resetKey}`);
});

test("loads the map view", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "kikk" })).toBeVisible();
  await expect(page.locator(".leaflet-container")).toBeVisible();
});

test("navigates between main views", async ({ page }) => {
  await page.getByRole("button", { name: /Kikket på/i }).click();
  await expect(page.getByRole("heading", { name: /kikket på/i })).toBeVisible();
  await expect(page.getByText("Ingen observasjoner ennå")).toBeVisible();

  await page.goto("/");

  await page.getByRole("button", { name: /Statistikk/i }).click();
  await expect(
    page.getByRole("heading", { name: /statistikk/i }),
  ).toBeVisible();
  await expect(page.getByText("Ingen observasjoner ennå")).toBeVisible();
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
