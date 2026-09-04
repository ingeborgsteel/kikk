import { createContext, ReactNode, useContext } from "react";
import { UserLocation } from "../types/location";
import {
  useCreateUserLocation,
  useDeleteUserLocation,
  useFetchUserLocations,
  useUpdateUserLocation,
} from "../queries/useUserLocation.ts";
import { CreateUserLocation } from "../api/locations.ts";

interface LocationsContextType {
  locations: UserLocation[];
  addLocation: (location: CreateUserLocation) => UserLocation;
  updateLocation: (location: UserLocation) => void;
  deleteLocation: (id: string) => void;
}

const LocationsContext = createContext<LocationsContextType | undefined>(
  undefined,
);

export function LocationsProvider({ children }: { children: ReactNode }) {
  const { data: locations = [] } = useFetchUserLocations();

  const { mutateAsync: create } = useCreateUserLocation();
  const { mutateAsync: remove } = useDeleteUserLocation();
  const { mutateAsync: update } = useUpdateUserLocation();

  const addLocation = (location: CreateUserLocation): UserLocation => {
    const newLocation: UserLocation = {
      ...location,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Note: Server will assign its own ID; the returned local ID is optimistic.
    create(location);

    return newLocation;
  };

  const updateLocation = (updatedLocation: UserLocation) => {
    update(updatedLocation);
  };

  const deleteLocation = (id: string) => {
    remove(id);
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
