import { FeatureAlert } from "../types/featureAlert";

/**
 * Central registry of "Nytt i kikk" feature alerts.
 *
 * When you ship a user-facing feature, append a new entry here (newest last)
 * with a stable unique id — see the feature-alert skill
 * (.devin/skills/feature-alert/SKILL.md) for the full checklist.
 *
 * Each alert is shown once per user in a modal on app load, and remains
 * visible in the archive at /news after dismissal. Dismissals are stored in
 * D1 (feature_alert_dismissals) for signed-in users and in localStorage for
 * guest users.
 */
export const featureAlerts: FeatureAlert[] = [
  {
    id: "2026-09-feature-alerts",
    title: "Nyheter i kikk",
    description:
      "Nå får du beskjed i appen når det kommer nye funksjoner! Lukk varslet for å slippe å se det igjen, og se alle tidligere nyheter under «Nyheter» i menybaren.",
    publishedAt: "2026-09-18",
    link: { url: "/news", label: "Se nyhetene" },
    screenshot: "/feature-alerts/nyheter-modal.png",
  },
  {
    id: "2026-09-navigation",
    title: "Enklere navigasjon",
    description:
      "På mobil ligger navigasjonen i en svevende knapp nederst til høyre — trykk for å åpne den, og «Meny» tar deg til alle sidene. På web er alt samlet i rullegardinmenyen øverst. «Forslag» har også flyttet inn i menyen.",
    publishedAt: "2026-09-18",
    screenshot: "/feature-alerts/nav-mobil.jpg",
  },
];
