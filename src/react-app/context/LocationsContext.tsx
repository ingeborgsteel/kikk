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
  addLocation: (location: CreateUserLocation) => Promise<UserLocation>;
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

  const addLocation = (location: CreateUserLocation): Promise<UserLocation> =>
    create(location);

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
