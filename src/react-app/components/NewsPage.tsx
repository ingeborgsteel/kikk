import { Newspaper } from "lucide-react";
import { FeatureAlertCard } from "./FeatureAlertCard";
import { useFeatureAlerts } from "../context/FeatureAlertsContext";
import Header from "./Header.tsx";

/**
 * Archive of all "Nytt i kikk" feature alerts, newest first. Undismissed
 * alerts are marked with a "Ny" badge — they stay listed here after the
 * popup modal has been dismissed.
 */
export function NewsPage() {
  const { alerts, undismissedIds } = useFeatureAlerts();

  return (
    <div className="w-full min-h-screen bg-sand dark:bg-bark pb-16 md:pb-0">
      <Header title={"nyheter"} />

      <div className="max-w-4xl mx-auto p-lg md:p-xl">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-bark/60 dark:text-sand/60">
            <Newspaper size={48} className="mx-auto mb-2 opacity-50" />
            <p>Ingen nyheter ennå</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30"
              >
                {undismissedIds.has(alert.id) && (
                  <span className="inline-block mb-2 rounded-full bg-rust px-2 py-0.5 text-xs font-bold text-sand">
                    Ny
                  </span>
                )}
                <FeatureAlertCard alert={alert} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
