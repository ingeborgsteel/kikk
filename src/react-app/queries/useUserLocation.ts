import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createUserLocation,
  CreateUserLocation,
  deleteUserLocation,
  fetchUserLocations,
  updateUserLocation,
} from "../api/locations.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { UserLocation } from "../types/location.ts";

export function useFetchUserLocations(options?: { enabled?: boolean }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-locations", user?.id],
    queryFn: () => fetchUserLocations(user?.id),
    ...options,
  });
}

export function useCreateUserLocation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (location: CreateUserLocation) => createUserLocation(location, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-locations"] });
    },
  });
}

export function useUpdateUserLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (location: UserLocation) => updateUserLocation(location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-locations"] });
    },
  });
}

export function useDeleteUserLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationId: string) => deleteUserLocation(locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-locations"] });
    },
  });
}
