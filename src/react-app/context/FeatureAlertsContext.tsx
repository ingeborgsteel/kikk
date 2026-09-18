import { createContext, ReactNode, useContext, useMemo } from "react";
import dayjs from "dayjs";
import { FeatureAlert } from "../types/featureAlert";
import { featureAlerts } from "../data/featureAlerts";
import {
  useDismissedFeatureAlerts,
  useDismissFeatureAlert,
} from "../queries/useFeatureAlertDismissals";
import { useAuth, getGuestCreatedAt } from "./AuthContext";

interface FeatureAlertsContextType {
  /** All registered alerts, newest first. */
  alerts: FeatureAlert[];
  /** Alerts the current user has not dismissed yet, newest first. Only
   * includes alerts published on/after the day the user joined — new users
   * never see alerts that predate them. */
  undismissedAlerts: FeatureAlert[];
  /** Ids of undismissed alerts relevant to the current user. */
  undismissedIds: Set<string>;
  /** Ids of alerts the current user has dismissed. */
  dismissedIds: Set<string>;
  /** Mark alerts as dismissed so they are not shown again. */
  dismissAlerts: (ids: string[]) => void;
  isLoading: boolean;
}

const FeatureAlertsContext = createContext<
  FeatureAlertsContextType | undefined
>(undefined);

export function FeatureAlertsProvider({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth();
  const { data: dismissed, isLoading } = useDismissedFeatureAlerts();
  const { mutate: dismiss } = useDismissFeatureAlert();

  const dismissedIds = useMemo(() => new Set(dismissed ?? []), [dismissed]);

  // Date (YYYY-MM-DD) the user joined. Authenticated users come from
  // Better Auth; new guests get a timestamp when their id is generated.
  // Legacy guests without a timestamp are treated as existing users and
  // remain eligible for all alerts.
  const userStartDate = useMemo(() => {
    if (!user) return null;
    if (isGuest) return getGuestCreatedAt();
    return user.createdAt ? dayjs(user.createdAt).format("YYYY-MM-DD") : null;
  }, [user, isGuest]);

  const alerts = useMemo(
    () =>
      [...featureAlerts].sort((a, b) =>
        b.publishedAt.localeCompare(a.publishedAt),
      ),
    [],
  );

  const undismissedAlerts = useMemo(
    () =>
      alerts.filter(
        (alert) =>
          !dismissedIds.has(alert.id) &&
          (!userStartDate || alert.publishedAt >= userStartDate),
      ),
    [alerts, dismissedIds, userStartDate],
  );

  const undismissedIds = useMemo(
    () => new Set(undismissedAlerts.map((alert) => alert.id)),
    [undismissedAlerts],
  );

  const dismissAlerts = (ids: string[]) => {
    ids.forEach((id) => dismiss(id));
  };

  return (
    <FeatureAlertsContext.Provider
      value={{
        alerts,
        undismissedAlerts,
        undismissedIds,
        dismissedIds,
        dismissAlerts,
        isLoading,
      }}
    >
      {children}
    </FeatureAlertsContext.Provider>
  );
}

export function useFeatureAlerts() {
  const context = useContext(FeatureAlertsContext);
  if (context === undefined) {
    throw new Error(
      "useFeatureAlerts must be used within a FeatureAlertsProvider",
    );
  }
  return context;
}
