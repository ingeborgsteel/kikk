import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface StoredPosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface GeolocationContextType {
  currentPosition: StoredPosition | null;
  followMode: boolean;
  setFollowMode: (enabled: boolean) => void;
  isLocating: boolean;
  isTracking: boolean;
  locationError: string | null;
  clearLocationError: () => void;
  requestCurrentPosition: () => Promise<StoredPosition | null>;
  startTracking: () => void;
  stopTracking: () => void;
}

const GeolocationContext = createContext<GeolocationContextType | undefined>(
  undefined,
);

const FOLLOW_MODE_STORAGE_KEY = "kikk-follow-mode";
const LAST_POSITION_STORAGE_KEY = "kikk-last-geolocation";

const LOCATION_REQUEST_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000,
};

const LOCATION_WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 10000,
};

function normalizeGeolocationError(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Plasseringstillatelse nektet. Vennligst aktiver posisjonstilgang i nettleserinnstillingene dine.";
    case error.POSITION_UNAVAILABLE:
      return "Posisjonsinformasjon er ikke tilgjengelig.";
    case error.TIMEOUT:
      return "Posisjonsforespørsel tidsavbrutt. Vennligst prøv igjen.";
    default:
      return "Kunne ikke finne din posisjon";
  }
}

function readBooleanStorage(key: string, defaultValue: boolean): boolean {
  const value = localStorage.getItem(key);
  if (value === null) return defaultValue;
  return value === "true";
}

function parsePosition(value: string | null): StoredPosition | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as StoredPosition;
    if (
      typeof parsed.lat === "number" &&
      typeof parsed.lng === "number" &&
      typeof parsed.accuracy === "number" &&
      typeof parsed.timestamp === "number"
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function toPosition(position: globalThis.GeolocationPosition): StoredPosition {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp,
  };
}

export function GeolocationProvider({ children }: { children: ReactNode }) {
  const [currentPosition, setCurrentPosition] = useState<StoredPosition | null>(
    () => parsePosition(localStorage.getItem(LAST_POSITION_STORAGE_KEY)),
  );
  const [followMode, setFollowModeState] = useState<boolean>(() =>
    readBooleanStorage(FOLLOW_MODE_STORAGE_KEY, true),
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const updatePosition = useCallback((position: StoredPosition) => {
    setCurrentPosition(position);
    localStorage.setItem(LAST_POSITION_STORAGE_KEY, JSON.stringify(position));
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const setFollowMode = useCallback((enabled: boolean) => {
    setFollowModeState(enabled);
    localStorage.setItem(FOLLOW_MODE_STORAGE_KEY, String(enabled));
  }, []);

  const clearLocationError = useCallback(() => {
    setLocationError(null);
  }, []);

  const requestCurrentPosition = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolokalisering støttes ikke av nettleseren din.");
      return null;
    }

    // Check permission state before calling — avoids a browser prompt if already denied,
    // and skips the loading spinner if already granted (position resolves silently).
    if ("permissions" in navigator) {
      const perm = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });
      if (perm.state === "denied") {
        setLocationError(
          "Plasseringstillatelse nektet. Vennligst aktiver posisjonstilgang i nettleserinnstillingene dine.",
        );
        setFollowMode(false);
        return null;
      }
    }

    setIsLocating(true);
    setLocationError(null);

    return await new Promise<StoredPosition | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextPosition = toPosition(position);
          updatePosition(nextPosition);
          setIsLocating(false);
          resolve(nextPosition);
        },
        (error) => {
          const normalizedError = normalizeGeolocationError(error);
          setLocationError(normalizedError);
          setIsLocating(false);
          if (error.code === error.PERMISSION_DENIED) {
            setFollowMode(false);
          }
          resolve(null);
        },
        LOCATION_REQUEST_OPTIONS,
      );
    });
  }, [setFollowMode, updatePosition]);

  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolokalisering støttes ikke av nettleseren din.");
      return;
    }

    if (watchIdRef.current !== null) {
      return;
    }

    setLocationError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const nextPosition = toPosition(position);
        updatePosition(nextPosition);
        setIsTracking(true);
      },
      (error) => {
        const normalizedError = normalizeGeolocationError(error);
        setLocationError(normalizedError);
        if (error.code === error.PERMISSION_DENIED) {
          setFollowMode(false);
          stopTracking();
          return;
        }
        setIsTracking(false);
      },
      LOCATION_WATCH_OPTIONS,
    );

    setIsTracking(true);
  }, [setFollowMode, stopTracking, updatePosition]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === FOLLOW_MODE_STORAGE_KEY && event.newValue !== null) {
        setFollowModeState(event.newValue === "true");
      }
      if (event.key === LAST_POSITION_STORAGE_KEY) {
        setCurrentPosition(parsePosition(event.newValue));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return (
    <GeolocationContext.Provider
      value={{
        currentPosition,
        followMode,
        setFollowMode,
        isLocating,
        isTracking,
        locationError,
        clearLocationError,
        requestCurrentPosition,
        startTracking,
        stopTracking,
      }}
    >
      {children}
    </GeolocationContext.Provider>
  );
}

export function useGeolocation() {
  const context = useContext(GeolocationContext);
  if (context === undefined) {
    throw new Error("useGeolocation must be used within a GeolocationProvider");
  }
  return context;
}
