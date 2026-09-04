import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "../api/users.ts";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000,
  });
}
