import { useQuery } from "@tanstack/react-query";
import { fetchUserAccesses } from "../api/user_accesses.ts";
import { UserAccess } from "../types/user_access.ts";

export const useUserAccesses = (
  userId: string,
  options: { enabled: boolean },
) => {
  return useQuery<UserAccess | undefined>({
    queryKey: ["user", userId, "access"],
    queryFn: () => fetchUserAccesses(userId),
    ...options,
  });
};
