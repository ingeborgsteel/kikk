import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Observation } from "../types/observation";
import {
  useCreateObservation,
  useDeleteObservation,
  useFetchObservations,
  useUpdateObservation,
} from "../queries/useObservation.ts";
import { CreateObservation } from "../api/observations.ts";
import { isSupabaseConfigured } from "../lib/supabase.ts";

interface ObservationsContextType {
  observations: Observation[];
  addObservation: (observation: CreateObservation) => void;
  updateObservation: (observation: Observation) => void;
  deleteObservation: (id: string) => void;
  pendingSyncCount: number;
}

const ObservationsContext = createContext<ObservationsContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "kikk_observations";
const OFFLINE_QUEUE_KEY = "kikk_offline_queue";

function useOnlineStatus() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

function loadQueue(): Observation[] {
  try {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: Observation[]) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function ObservationsProvider({ children }: { children: ReactNode }) {
  const supabaseConfigured = useMemo(() => isSupabaseConfigured(), []);
  const isOnline = useOnlineStatus();
  const isDraining = useRef(false);

  // Offline queue for Supabase mode
  const [offlineQueue, setOfflineQueue] = useState<Observation[]>(loadQueue);

  // Local state for when Supabase is not configured
  const [localObservations, setLocalObservations] = useState<Observation[]>(
    () => {
      if (supabaseConfigured) return [];
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  );

  // Supabase hooks (disabled when not configured)
  const { data: supabaseObservations = [] } = useFetchObservations({
    enabled: supabaseConfigured,
  });
  const { mutateAsync: create } = useCreateObservation();
  const { mutateAsync: remove } = useDeleteObservation();
  const { mutateAsync: update } = useUpdateObservation();

  // Merge queued observations on top of Supabase data so they appear immediately
  const observations = useMemo(() => {
    if (!supabaseConfigured) return localObservations;
    const supabaseIds = new Set(supabaseObservations.map((o) => o.id));
    const pending = offlineQueue.filter((o) => !supabaseIds.has(o.id));
    return [...pending, ...supabaseObservations];
  }, [
    supabaseConfigured,
    supabaseObservations,
    localObservations,
    offlineQueue,
  ]);

  // Persist local observations
  useEffect(() => {
    if (!supabaseConfigured) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localObservations));
    }
  }, [localObservations, supabaseConfigured]);

  // Persist queue whenever it changes
  useEffect(() => {
    saveQueue(offlineQueue);
  }, [offlineQueue]);

  // Drain queue when back online
  const drainQueue = useCallback(async () => {
    if (isDraining.current || offlineQueue.length === 0) return;
    isDraining.current = true;
    const queue = [...offlineQueue];
    for (const obs of queue) {
      try {
        const { id, createdAt, updatedAt, species, ...rest } = obs;
        void id;
        void createdAt;
        void updatedAt;
        await create({
          ...rest,
          species: species.map(({ id: sid, createdAt: sca, ...s }) => {
            void sid;
            void sca;
            return s;
          }),
        });
        setOfflineQueue((prev) => prev.filter((o) => o.id !== obs.id));
      } catch {
        break;
      }
    }
    isDraining.current = false;
  }, [offlineQueue, create]);

  useEffect(() => {
    if (isOnline && supabaseConfigured && offlineQueue.length > 0) {
      drainQueue();
    }
  }, [isOnline, supabaseConfigured, offlineQueue.length, drainQueue]);

  const addObservation = useCallback(
    (observation: CreateObservation) => {
      if (supabaseConfigured) {
        const newObservation: Observation = {
          ...observation,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastExportedAt: undefined,
          exportCount: 0,
          species: observation.species.map((s) => ({
            ...s,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          })),
        };
        if (isOnline) {
          create(observation);
        } else {
          setOfflineQueue((prev) => [newObservation, ...prev]);
        }
      } else {
        const newObservation: Observation = {
          ...observation,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastExportedAt: undefined,
          exportCount: 0,
          species: observation.species.map((s) => ({
            ...s,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          })),
        };
        setLocalObservations((prev) => [...prev, newObservation]);
      }
    },
    [supabaseConfigured, isOnline, create],
  );

  const updateObservation = useCallback(
    (updatedObservation: Observation) => {
      if (supabaseConfigured) {
        // If it's a queued (not-yet-synced) observation, update it in the queue
        const isQueued = offlineQueue.some(
          (o) => o.id === updatedObservation.id,
        );
        if (isQueued) {
          setOfflineQueue((prev) =>
            prev.map((o) =>
              o.id === updatedObservation.id
                ? { ...updatedObservation, updatedAt: new Date().toISOString() }
                : o,
            ),
          );
        } else {
          update(updatedObservation);
        }
      } else {
        setLocalObservations((prev) =>
          prev.map((obs) =>
            obs.id === updatedObservation.id
              ? { ...updatedObservation, updatedAt: new Date().toISOString() }
              : obs,
          ),
        );
      }
    },
    [supabaseConfigured, offlineQueue, update],
  );

  const deleteObservation = useCallback(
    (id: string) => {
      if (supabaseConfigured) {
        const isQueued = offlineQueue.some((o) => o.id === id);
        if (isQueued) {
          setOfflineQueue((prev) => prev.filter((o) => o.id !== id));
        } else {
          remove(id);
        }
      } else {
        setLocalObservations((prev) => prev.filter((obs) => obs.id !== id));
      }
    },
    [supabaseConfigured, offlineQueue, remove],
  );

  return (
    <ObservationsContext.Provider
      value={{
        observations,
        addObservation,
        updateObservation,
        deleteObservation,
        pendingSyncCount: offlineQueue.length,
      }}
    >
      {children}
    </ObservationsContext.Provider>
  );
}

export function useObservations() {
  const context = useContext(ObservationsContext);
  if (context === undefined) {
    throw new Error(
      "useObservations must be used within an ObservationsProvider",
    );
  }
  return context;
}
