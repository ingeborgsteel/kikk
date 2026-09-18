import { Sparkles } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/button";
import { FeatureAlertCard } from "./FeatureAlertCard";
import { useFeatureAlerts } from "../context/FeatureAlertsContext";
import { useAuth } from "../context/AuthContext";

/**
 * "Nytt i kikk" modal — pops up on app load when the current user has
 * undismissed feature alerts. Closing it (any way) marks every shown alert
 * as dismissed so it is never shown again; dismissed alerts remain visible
 * in the archive at /news.
 */
export function FeatureAlertsModal() {
  const { undismissedAlerts, dismissAlerts, isLoading } = useFeatureAlerts();
  const { isImpersonating } = useAuth();

  const isOpen = !isLoading && !isImpersonating && undismissedAlerts.length > 0;

  const handleClose = () => {
    dismissAlerts(undismissedAlerts.map((alert) => alert.id));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nytt i kikk"
      icon={<Sparkles size={24} />}
      maxWidth="max-w-lg"
      footer={
        <Button onClick={handleClose} className="w-full">
          Skjønner!
        </Button>
      }
    >
      <div className="space-y-lg divide-y divide-moss/30 [&>*:not(:first-child)]:pt-lg">
        {undismissedAlerts.map((alert) => (
          <FeatureAlertCard
            key={alert.id}
            alert={alert}
            onInternalLink={handleClose}
          />
        ))}
      </div>
    </Modal>
  );
}
