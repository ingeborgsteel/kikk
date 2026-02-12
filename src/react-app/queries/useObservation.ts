import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  });
};

export function useCreateObservation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: CreateObservation) => createObservation(input, user),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["observations"] });
    },
  });
}

export function useUpdateObservation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: Observation) => updateObservation(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["observations"] });
    },
  });
}

export function useDeleteObservation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (observationId: string) => deleteObservation(observationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["observations"] });
    },
  });
}
