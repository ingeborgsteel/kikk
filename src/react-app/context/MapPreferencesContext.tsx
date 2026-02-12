import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type MapLayer = "standard" | "topo" | "aerial";

interface MapPreferencesContextType {
  currentLayer: MapLayer;
  setCurrentLayer: (layer: MapLayer) => void;
}

const MapPreferencesContext = createContext<
  MapPreferencesContextType | undefined
>(undefined);

const MAP_LAYER_STORAGE_KEY = "kikk-map-layer";

/**
 * Provider for map preferences (selected layer, etc.)
 * Persists preferences to localStorage.
 */
export function MapPreferencesProvider({ children }: { children: ReactNode }) {
  const [currentLayer, setCurrentLayerState] = useState<MapLayer>(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(MAP_LAYER_STORAGE_KEY);
    return (stored as MapLayer) || "standard";
  });

  const setCurrentLayer = (layer: MapLayer) => {
    setCurrentLayerState(layer);
    localStorage.setItem(MAP_LAYER_STORAGE_KEY, layer);
  };

  useEffect(() => {
    // Sync with localStorage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MAP_LAYER_STORAGE_KEY && e.newValue) {
        setCurrentLayerState(e.newValue as MapLayer);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <MapPreferencesContext.Provider value={{ currentLayer, setCurrentLayer }}>
      {children}
    </MapPreferencesContext.Provider>
  );
}

/**
 * Hook to access map preferences (selected layer, etc.)
 */
export function useMapPreferences() {
  const context = useContext(MapPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useMapPreferences must be used within a MapPreferencesProvider",
    );
  }
  return context;
}
