export interface FeatureAlert {
  /** Stable unique id, e.g. "2026-09-feature-alerts". Never reuse or change. */
  id: string;
  /** Short Norwegian title shown in the "Nytt i kikk" modal and archive. */
  title: string;
  /** Description of the feature for users. */
  description: string;
  /** ISO date used for sorting the archive (newest first). */
  publishedAt: string;
  /** Optional link to where the feature can be used. */
  link?: {
    /** Internal app path (e.g. "/news") or external URL. */
    url: string;
    /** Link label, e.g. "Prøv det". */
    label: string;
  };
  /** Optional screenshot path under public/, e.g. "/feature-alerts/news.png". */
  screenshot?: string;
}
