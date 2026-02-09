import {supabase} from "../lib/supabase.ts";
import {UserLocation} from "../types/location.ts";

export async function fetchUserLocations(userId?: string): Promise<UserLocation[]> {
  let query = supabase
    .from("locations")
    .select("*")
    .order('createdAt', {ascending: false});

  if (userId) {
    query = query.eq("userId", userId);
  } else {
    query = query.is("userId", null);
  }

  const {data, error} = await query;

  if (error) throw error;

  return data;
}

export type CreateUserLocation = Omit<UserLocation, "id" | "createdAt" | "updatedAt">;

export async function createUserLocation(
  location: CreateUserLocation,
  user: { id: string } | null = null,
): Promise<UserLocation> {
  const {data, error} = await supabase
    .from("locations")
    .insert({
      ...location,
      userId: user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to insert user location");

  return data;
}

export async function updateUserLocation(location: UserLocation): Promise<UserLocation> {
  const {data, error} = await supabase
    .from("locations")
    .update({
      ...location,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", location.id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to update user location");

  return data;
}

export async function deleteUserLocation(locationId: string): Promise<void> {
  const {error} = await supabase
    .from("locations")
    .delete()
    .eq("id", locationId);

  if (error) throw error;
}
