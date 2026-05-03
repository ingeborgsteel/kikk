import { supabase } from "../lib/supabase.ts";
import { UserAccess } from "../types/user_access.ts";

export async function fetchUserAccesses(
  userId: string,
): Promise<UserAccess | undefined> {
  const { data, error } = await supabase
    .from("user_accesses")
    .select("*")
    .eq("user_id", userId);

  if (!data || data.length === 0) {
    return undefined;
  }

  if (error) throw error;

  return data[0] as UserAccess;
}
