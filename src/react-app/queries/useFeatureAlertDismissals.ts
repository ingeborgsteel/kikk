import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  dismissFeatureAlert,
  fetchDismissedFeatureAlerts,
} from "../api/featureAlerts.ts";
import {
  readDismissedFeatureAlerts,
  writeDismissedFeatureAlerts,
} from "../lib/featureAlertStorage.ts";
import { useAuth } from "../context/AuthContext.tsx";

export function useDismissedFeatureAlerts() {
  const { user, isGuest } = useAuth();
  return useQuery<string[]>({
    queryKey: ["feature-alert-dismissals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      if (isGuest) return readDismissedFeatureAlerts(user.id);
      return fetchDismissedFeatureAlerts(user.id);
    },
    enabled: !!user,
    placeholderData: keepPreviousData,
  });
}

export function useDismissFeatureAlert() {
  const qc = useQueryClient();
  const { user, isGuest } = useAuth();

  return useMutation({
    mutationFn: async (alertId: string) => {
      if (!user) return;
      if (isGuest) {
        const existing = readDismissedFeatureAlerts(user.id);
        if (!existing.includes(alertId)) {
          writeDismissedFeatureAlerts(user.id, [...existing, alertId]);
        }
        return;
      }
      await dismissFeatureAlert(user.id, alertId);
    },
    onMutate: async (alertId) => {
      await qc.cancelQueries({ queryKey: ["feature-alert-dismissals"] });
      const previous = qc.getQueriesData<string[]>({
        queryKey: ["feature-alert-dismissals"],
      });
      qc.setQueriesData<string[]>(
        { queryKey: ["feature-alert-dismissals"] },
        (old) => (old?.includes(alertId) ? old : [...(old ?? []), alertId]),
      );
      return { previous };
    },
    onError: (_err, _alertId, context) => {
      context?.previous.forEach(([queryKey, data]) => {
        qc.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["feature-alert-dismissals"] });
    },
  });
}
