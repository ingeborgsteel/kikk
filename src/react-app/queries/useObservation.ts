import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Observation } from "../types/observation.ts";
import {
  createObservation,
  CreateObservation,
  deleteObservation,
  fetchObservations,
  updateObservation,
} from "../api/observations.ts";
import { useAuth } from "../context/AuthContext.tsx";

export const useFetchObservations = (options?: { enabled?: boolean }) => {
  const { user } = useAuth();
  return useQuery<Observation[]>({
    queryFn: () => fetchObservations(user?.id),
    queryKey: ["observations", user?.id],
    enabled: options?.enabled ?? true,
    // Keep showing the last successful data (instead of clearing to
    // undefined/loading) while a refetch is in flight, e.g. after an
    // invalidation triggered by a mutation.
    placeholderData: keepPreviousData,
  });
};

export function useCreateObservation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: CreateObservation) => createObservation(input, user),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["observations"] });
      const previous = qc.getQueriesData<Observation[]>({
        queryKey: ["observations"],
      });

      const optimisticObservation: Observation = {
        ...input,
        id: `optimistic-${crypto.randomUUID()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        species: input.species.map((s) => ({
          ...s,
          id: `optimistic-${crypto.randomUUID()}`,
          createdAt: new Date().toISOString(),
        })),
      };

      qc.setQueriesData<Observation[]>(
        { queryKey: ["observations"] },
        (old) => [optimisticObservation, ...(old ?? [])],
      );

      return { previous };
    },
    onError: (_err, _input, context) => {
      context?.previous.forEach(([queryKey, data]) => {
        qc.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["observations"] });
    },
  });
}

export function useUpdateObservation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: Observation) => updateObservation(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["observations"] });
      const previous = qc.getQueriesData<Observation[]>({
        queryKey: ["observations"],
      });

      qc.setQueriesData<Observation[]>(
        { queryKey: ["observations"] },
        (old) =>
          old?.map((obs) => (obs.id === input.id ? input : obs)) ?? old,
      );

      return { previous };
    },
    onError: (_err, _input, context) => {
      context?.previous.forEach(([queryKey, data]) => {
        qc.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["observations"] });
    },
  });
}

export function useDeleteObservation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (observationId: string) => deleteObservation(observationId),
    onMutate: async (observationId) => {
      await qc.cancelQueries({ queryKey: ["observations"] });
      const previous = qc.getQueriesData<Observation[]>({
        queryKey: ["observations"],
      });

      qc.setQueriesData<Observation[]>(
        { queryKey: ["observations"] },
        (old) => old?.filter((obs) => obs.id !== observationId) ?? old,
      );

      return { previous };
    },
    onError: (_err, _observationId, context) => {
      context?.previous.forEach(([queryKey, data]) => {
        qc.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["observations"] });
    },
  });
}
