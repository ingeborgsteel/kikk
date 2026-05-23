import { supabase } from "../lib/supabase.ts";
import { Profile } from "../types/profile.ts";

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, updated_at")
    .order("display_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
