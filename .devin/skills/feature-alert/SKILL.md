---
name: feature-alert
description: Add a "Nytt i kikk" feature alert entry when shipping a user-facing feature
---

# Feature Alert ("Nytt i kikk")

kikk has a built-in feature-announcement system. Whenever you ship a **user-facing feature or notable change**, append an alert so users see what is new.

## When to run

- At the end of any feature that changes what users can see or do (new page, new control, new workflow).
- Skip for invisible/internal work: refactors, dependency bumps, CI, backend-only changes users can't perceive.
- **When in doubt, ask the user** whether the change warrants an alert — the user decides, don't assume either way. This applies to fixes too, not just new features.

## How to add an alert

Append an entry to the `featureAlerts` array in `src/react-app/data/featureAlerts.ts` (newest last):

```typescript
{
  id: "2026-09-my-feature",        // stable unique id, e.g. "YYYY-MM-feature-name" — never reuse or change
  title: "Kort norsk tittel",
  description: "Hva er nytt, og hvorfor er det nyttig for brukeren?",
  publishedAt: "2026-09-18",        // ISO date, used for archive sorting
  link: { url: "/stats", label: "Prøv det" },   // optional — where the feature can be used
  screenshot: "/feature-alerts/my-feature.png", // optional
}
```

Field rules:

- **`id`**: must stay stable forever — it is the key in `feature_alert_dismissals` (D1) and in the guest localStorage fallback. Changing or reusing an id reshows/hides the wrong alert.
- **`title` / `description`**: Norwegian, matching the app's UI language. Describe the benefit, not the implementation.
- **`link`**: optional. Internal app paths start with `/` and use client-side navigation; external URLs open in a new tab.
- **`screenshot`**: optional. Save the image in `public/feature-alerts/` and reference it as `/feature-alerts/<file>.png`. Keep it small (it is precached by the service worker — stay well under the 4MB precache limit; aim for < 300KB).

## Testing notes

- The modal renders over the whole app for users with undismissed alerts, so **e2e specs must pre-dismiss alerts** or they will fail. Guest specs can seed `localStorage` with `kikk_dismissed_feature_alerts` = `{ "<guest-id>": [<all alert ids>] }` — see `e2e/smoke.spec.ts` `beforeEach` for the pattern.
- `page.addInitScript` re-runs on every navigation, including reloads — a `localStorage.clear()` inside it will wipe dismissal state. Guard one-time setup with a `sessionStorage` flag (see `e2e/feature-alerts.spec.ts`).
- Prefer distinct CTA labels in the alert UI — generic labels like "Lukk" already exist elsewhere (e.g. `Map.tsx`) and collide in Playwright strict-mode locators.

## How it works (don't reinvent)

- **Registry**: `src/react-app/data/featureAlerts.ts` — the single source of truth for all alerts, including old ones (they form the archive).
- **Popup**: `FeatureAlertsModal` (`components/FeatureAlertsModal.tsx`) shows undismissed alerts once on app load; any close dismisses all shown alerts.
- **Archive**: `/news` route (`components/NewsPage.tsx`) lists every alert, newest first; reachable via "Nyheter" in the app menu — the desktop header dropdown (`components/NavMenu.tsx`) and the mobile `/menu` page — which shows an unread-count badge.
- **Dismissal state**: per user — D1 table `feature_alert_dismissals` for signed-in users (`/api/feature-alert-dismissals`), localStorage key `kikk_dismissed_feature_alerts` for guests. Access via `useFeatureAlerts()` (`context/FeatureAlertsContext.tsx`).
- **New-user filtering**: an alert only counts as undismissed when `publishedAt` is on/after the day the user joined — signed-in users compare against Better Auth `user.createdAt`, guests against `kikk-guest-created-at` (stamped when a new guest id is generated; legacy guests without it are eligible for all alerts). New users therefore never see past alerts, but the `/news` archive still lists everything.
- **Card rendering**: `components/FeatureAlertCard.tsx` is shared by the modal and archive — extend it if alerts need richer content rather than adding one-off markup.
