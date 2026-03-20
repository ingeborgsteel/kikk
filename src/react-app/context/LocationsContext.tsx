import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { UserLocation } from "../types/location";
import {
  useCreateUserLocation,
  useDeleteUserLocation,
  useFetchUserLocations,
  useUpdateUserLocation,
} from "../queries/useUserLocation.ts";
import { CreateUserLocation } from "../api/locations.ts";
import { isSupabaseConfigured } from "../lib/supabase.ts";

interface LocationsContextType {
  locations: UserLocation[];
  addLocation: (location: CreateUserLocation) => UserLocation;
  updateLocation: (location: UserLocation) => void;
  deleteLocation: (id: string) => void;
}

const LocationsContext = createContext<LocationsContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "kikk_user_locations";

export function LocationsProvider({ children }: { children: ReactNode }) {
  // Memoize Supabase configuration check to avoid re-evaluation on every render
  const supabaseConfigured = useMemo(() => isSupabaseConfigured(), []);

  // Local state for when Supabase is not configured
  const [localLocations, setLocalLocations] = useState<UserLocation[]>(() => {
    if (supabaseConfigured) return [];
    // Load locations from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Supabase hooks (disabled when not configured to avoid unnecessary network requests)
  const { data: supabaseLocations = [] } = useFetchUserLocations({
    enabled: supabaseConfigured,
  });
  const { mutateAsync: create } = useCreateUserLocation();
  const { mutateAsync: remove } = useDeleteUserLocation();
  const { mutateAsync: update } = useUpdateUserLocation();

  // Select the appropriate locations source
  const locations = supabaseConfigured ? supabaseLocations : localLocations;

  // Save locations to localStorage whenever they change (only in local mode)
  useEffect(() => {
    if (!supabaseConfigured) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
    }
  }, [locations, supabaseConfigured]);

  const addLocation = (location: CreateUserLocation): UserLocation => {
    const newLocation: UserLocation = {
      ...location,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (supabaseConfigured) {
      // Note: Server will assign its own ID; the returned local ID is optimistic.
      // For Supabase users, the locationId link may not match after query refresh.
      create(location);
    } else {
      setLocalLocations((prev) => [...prev, newLocation]);
    }

    return newLocation;
  };

  const updateLocation = (updatedLocation: UserLocation) => {
    if (supabaseConfigured) {
      update(updatedLocation);
    } else {
      // Local mode: update in state
      setLocalLocations((prev) =>
        prev.map((loc) =>
          loc.id === updatedLocation.id
            ? {
                ...updatedLocation,
                updatedAt: new Date().toISOString(),
              }
            : loc,
        ),
      );
    }
  };

  const deleteLocation = (id: string) => {
    if (supabaseConfigured) {
      remove(id);
    } else {
      // Local mode: filter out from state
      setLocalLocations((prev) => prev.filter((loc) => loc.id !== id));
    }
  };

  return (
    <LocationsContext.Provider
      value={{ locations, addLocation, updateLocation, deleteLocation }}
    >
      {children}
    </LocationsContext.Provider>
  );
}

export function useLocations() {
  const context = useContext(LocationsContext);
  if (context === undefined) {
    throw new Error("useLocations must be used within a LocationsProvider");
  }
  return context;
}
