import { supabase } from "../lib/supabase.ts";
import { UserAccess } from "../types/user_access.ts";

export async function fetchUserAccesses(userId: string): Promise<UserAccess> {
  const { data, error } = await supabase
    .from("user_accesses")
    .select("*")
    .eq("userId", userId)
    .single();

  if (error) throw error;

  return data as UserAccess;
}
