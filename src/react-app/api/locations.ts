import { supabase } from "../lib/supabase.ts";
import { UserLocation } from "../types/location.ts";

export async function fetchUserLocations(userId?: string): Promise<UserLocation[]> {
  let query = supabase
    .from("user_locations")
    .select("*")
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    query = query.is("user_id", null);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Transform snake_case to camelCase
  return (data ?? []).map(loc => ({
    id: loc.id,
    userId: loc.user_id,
    name: loc.name,
    location: {
      lat: loc.lat,
      lng: loc.lng,
    },
    uncertaintyRadius: loc.uncertainty_radius,
    description: loc.description,
    createdAt: loc.created_at,
    updatedAt: loc.updated_at,
  }));
}

export type CreateUserLocation = Omit<UserLocation, "id" | "createdAt" | "updatedAt">;

export async function createUserLocation(
  location: CreateUserLocation,
  user: { id: string } | null = null,
): Promise<UserLocation> {
  const { data, error } = await supabase
    .from("user_locations")
    .insert({
      user_id: user?.id,
      name: location.name,
      lat: location.location.lat,
      lng: location.location.lng,
      uncertainty_radius: location.uncertaintyRadius,
      description: location.description,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to insert user location");

  // Transform snake_case to camelCase
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    location: {
      lat: data.lat,
      lng: data.lng,
    },
    uncertaintyRadius: data.uncertainty_radius,
    description: data.description,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateUserLocation(location: UserLocation): Promise<UserLocation> {
  const { data, error } = await supabase
    .from("user_locations")
    .update({
      name: location.name,
      lat: location.location.lat,
      lng: location.location.lng,
      uncertainty_radius: location.uncertaintyRadius,
      description: location.description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", location.id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to update user location");

  // Transform snake_case to camelCase
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    location: {
      lat: data.lat,
      lng: data.lng,
    },
    uncertaintyRadius: data.uncertainty_radius,
    description: data.description,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deleteUserLocation(locationId: string): Promise<void> {
  const { error } = await supabase
    .from("user_locations")
    .delete()
    .eq("id", locationId);

  if (error) throw error;
}
