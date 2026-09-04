import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchAdminUsers, sendAdminPasswordReset } from "../api/admin";
import { betterAuthClient } from "../lib/auth";

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchAdminUsers,
    staleTime: 60_000,
  });
};

export const useSendAdminPasswordReset = () => {
  return useMutation({
    mutationFn: sendAdminPasswordReset,
  });
};

export const useImpersonateUser = () => {
  return useMutation({
    mutationFn: async (userId: string) => {
      await betterAuthClient.admin.impersonateUser({ userId });
      window.location.reload();
    },
  });
};
