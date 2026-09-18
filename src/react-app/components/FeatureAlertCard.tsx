import { useState } from "react";
import dayjs from "dayjs";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FeatureAlert } from "../types/featureAlert";
import { Button } from "./ui/button";

interface FeatureAlertCardProps {
  alert: FeatureAlert;
  /** Called before navigating to an internal link (e.g. to close a modal). */
  onInternalLink?: () => void;
}

/**
 * Shared rendering of a single "Nytt i kikk" feature alert — used by the
 * FeatureAlertsModal and the /news archive page.
 */
export function FeatureAlertCard({
  alert,
  onInternalLink,
}: FeatureAlertCardProps) {
  const navigate = useNavigate();

  const handleLink = () => {
    if (!alert.link) return;
    if (alert.link.url.startsWith("/")) {
      onInternalLink?.();
      navigate(alert.link.url);
    } else {
      window.open(alert.link.url, "_blank", "noopener,noreferrer");
    }
  };

  const [screenshotFailed, setScreenshotFailed] = useState(false);

  return (
    <article className="space-y-3">
      {alert.screenshot && !screenshotFailed && (
        <img
          src={alert.screenshot}
          alt={`Skjermbilde: ${alert.title}`}
          onError={() => setScreenshotFailed(true)}
          className="mx-auto block h-auto max-h-56 w-auto max-w-full rounded-md border-2 border-moss/30 object-contain"
        />
      )}
      <div>
        <h3 className="text-lg font-semibold text-bark dark:text-sand">
          {alert.title}
        </h3>
        <p className="text-xs text-bark/60 dark:text-sand/60">
          {dayjs(alert.publishedAt).format("DD.MM.YYYY")}
        </p>
      </div>
      <p className="text-sm text-bark/80 dark:text-sand/80 whitespace-pre-line">
        {alert.description}
      </p>
      {alert.link && (
        <Button variant="outline" size="sm" onClick={handleLink}>
          {alert.link.label}
          {!alert.link.url.startsWith("/") && (
            <ExternalLink size={14} className="ml-1" />
          )}
        </Button>
      )}
    </article>
  );
}
