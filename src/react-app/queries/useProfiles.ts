import { useQuery } from "@tanstack/react-query";
import { fetchProfiles } from "../api/profiles.ts";

export function useProfiles(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}
