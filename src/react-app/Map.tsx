import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import L from "leaflet";
import { Observation } from "./types/observation";
import { UserLocation } from "./types/location";
import { useObservations } from "./context/ObservationsContext";

// Fix for default marker icons in Leaflet with bundlers
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import {
  kartverketAttribution,
  kartverketTopo,
  mapboxAttribution,
  mapboxSatellite,
  mapboxTopo,
} from "./lib/mapUtils.ts";
import {
  createObservationIconWithInitials,
  createSelectionIcon,
  createUserLocationIcon,
} from "./lib/markerIcons.ts";
import { useMapPreferences } from "./context/MapPreferencesContext.tsx";
import { useGeolocation } from "./context/GeolocationContext.tsx";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Create icon instances for use in the map
const SelectionIcon = createSelectionIcon();
const UserLocationIcon = createUserLocationIcon();

L.Marker.prototype.options.icon = DefaultIcon;

/**
 * Helper function to get tile layer configuration based on layer type
 */
const getTileLayerConfig = (
  layer: "standard" | "topo" | "aerial",
): { url: string; attribution: string } => {
  switch (layer) {
    case "aerial":
      return { url: mapboxSatellite, attribution: mapboxAttribution };
    case "topo":
      return { url: mapboxTopo, attribution: mapboxAttribution };
    default:
      return { url: kartverketTopo, attribution: kartverketAttribution };
  }
};

// Delay for map resize after initialization to ensure container dimensions are available
const MAP_RESIZE_DELAY_MS = 100;
const UNCERTAINTY_ZOOM_THRESHOLD = 9;
const DEFAULT_ZOOM = 15;

function useOnlineStatus() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

function lonToTileX(lon: number, zoom: number) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function latToTileY(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
      Math.pow(2, zoom),
  );
}

async function downloadVisibleTiles(
  map: L.Map,
  tileUrlTemplate: string,
  onProgress: (done: number, total: number) => void,
) {
  const bounds = map.getBounds();
  const minZoom = Math.max(map.getZoom() - 2, 1);
  const maxZoom = Math.min(map.getZoom() + 3, 17);
  const urls: string[] = [];

  for (let z = minZoom; z <= maxZoom; z++) {
    const x0 = lonToTileX(bounds.getWest(), z);
    const x1 = lonToTileX(bounds.getEast(), z);
    const y0 = latToTileY(bounds.getNorth(), z);
    const y1 = latToTileY(bounds.getSouth(), z);
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        const url = tileUrlTemplate
          .replace("{z}", String(z))
          .replace("{x}", String(x))
          .replace("{y}", String(y))
          .replace("{-y}", String(y));
        urls.push(url);
      }
    }
  }

  const BATCH = 8;
  let done = 0;
  for (let i = 0; i < urls.length; i += BATCH) {
    await Promise.all(
      urls
        .slice(i, i + BATCH)
        .map((url) => fetch(url, { mode: "no-cors" }).catch(() => null)),
    );
    done = Math.min(i + BATCH, urls.length);
    onProgress(done, urls.length);
  }
}

interface MapProps {
  onLocationSelect?: (lat: number, lng: number, zoom: number) => void;
  observations?: Observation[];
  onObservationClick?: (observationId: string) => void;
  userLocations?: UserLocation[];
  onUserLocationClick?: (locationId: string) => void;
}

function Map({
  onLocationSelect,
  observations = [],
  onObservationClick,
  userLocations = [],
  onUserLocationClick,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const isOnline = useOnlineStatus();
  const { pendingSyncCount } = useObservations();
  const [downloadProgress, setDownloadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const observationMarkersRef = useRef<L.Marker[]>([]);
  const observationCirclesRef = useRef<L.Circle[]>([]);
  const userLocationsMarkersRef = useRef<L.Marker[]>([]);
  const userLocationCirclesRef = useRef<L.Circle[]>([]);
  const userLocationMarkerRef = useRef<L.CircleMarker | null>(null);
  const [showCenteredMessage, setShowCenteredMessage] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
  const hasAutoLocatedRef = useRef(false);
  const { currentLayer, setCurrentLayer, showUncertaintyOverlay } =
    useMapPreferences();
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const downloadCurrentLayer = useCallback(async () => {
    if (!map.current) return;
    const { url } = getTileLayerConfig(currentLayer);
    setDownloadProgress({ done: 0, total: 1 });
    await downloadVisibleTiles(map.current, url, (done, total) => {
      setDownloadProgress({ done, total });
    });
    setTimeout(() => setDownloadProgress(null), 2000);
  }, [currentLayer]);
  const {
    currentPosition,
    followMode,
    setFollowMode,
    isLocating,
    locationError,
    clearLocationError,
    requestCurrentPosition,
    startTracking,
    stopTracking,
  } = useGeolocation();

  const renderUserLocationMarker = useCallback((lat: number, lng: number) => {
    if (!map.current) return;

    if (!userLocationMarkerRef.current) {
      userLocationMarkerRef.current = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: "#4285F4",
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map.current);
      return;
    }

    userLocationMarkerRef.current.setLatLng([lat, lng]);
  }, []);

  const recenterMapTo = useCallback(
    (lat: number, lng: number, zoom: number) => {
      if (!map.current) return;
      map.current.setView([lat, lng], zoom);
    },
    [],
  );

  // Update the ref whenever onLocationSelect changes
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with default center (Oslo, Norway)
    const defaultCenter: [number, number] = [59.9139, 10.7522];
    const defaultZoom = DEFAULT_ZOOM;

    map.current = L.map(mapContainer.current).setView(
      defaultCenter,
      defaultZoom,
    );

    // Add initial tile layer (standard OpenStreetMap)
    const { url, attribution } = getTileLayerConfig(currentLayer);
    tileLayerRef.current = L.tileLayer(url, {
      maxZoom: 20,
      maxNativeZoom: currentLayer === "standard" ? 18 : undefined,
      attribution,
    }).addTo(map.current);

    L.control
      .scale({ imperial: false, position: "bottomright" })
      .addTo(map.current);

    // Ensure the map container is properly sized
    // This is necessary when the container size is not immediately available
    setTimeout(() => {
      if (map.current) {
        map.current.invalidateSize();
      }
    }, MAP_RESIZE_DELAY_MS);

    // Add click handler to select location
    const mapInstance = map.current;
    setCurrentZoom(mapInstance.getZoom());
    mapInstance.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setSelectedLocation({ lat, lng });

      // Remove existing marker if any
      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Add new marker at clicked location with rust color
      if (map.current) {
        markerRef.current = L.marker([lat, lng], { icon: SelectionIcon }).addTo(
          map.current,
        );
      }

      // Call callback if provided
      if (onLocationSelectRef.current && map.current) {
        const currentZoom = map.current.getZoom();
        onLocationSelectRef.current(lat, lng, currentZoom);
      }
    });

    const handleDragStart = () => {
      setFollowMode(false);
    };

    const handleZoomEnd = () => {
      setCurrentZoom(mapInstance.getZoom());
    };

    mapInstance.on("dragstart", handleDragStart);
    mapInstance.on("zoomend", handleZoomEnd);

    // Cleanup
    return () => {
      mapInstance.off("dragstart", handleDragStart);
      mapInstance.off("zoomend", handleZoomEnd);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
      observationMarkersRef.current = [];
      observationCirclesRef.current = [];
      userLocationsMarkersRef.current = [];
      userLocationCirclesRef.current = [];
    };
  }, [setFollowMode]);

  useEffect(() => {
    if (!map.current) return;

    observationCirclesRef.current.forEach((circle) => circle.remove());
    observationCirclesRef.current = [];

    if (!showUncertaintyOverlay || currentZoom < UNCERTAINTY_ZOOM_THRESHOLD) {
      return;
    }

    observations.forEach((observation) => {
      if (!map.current) return;

      const circle = L.circle(
        [observation.location.lat, observation.location.lng],
        {
          radius: observation.uncertaintyRadius,
          color: "#1a3d32",
          fillColor: "#2F5D50",
          fillOpacity: 0.5,
          opacity: 0.7,
          weight: 1,
          interactive: false,
        },
      ).addTo(map.current);

      observationCirclesRef.current.push(circle);
    });
  }, [currentZoom, observations, showUncertaintyOverlay]);

  useEffect(() => {
    if (!map.current) return;

    userLocationCirclesRef.current.forEach((circle) => circle.remove());
    userLocationCirclesRef.current = [];

    if (!showUncertaintyOverlay || currentZoom < UNCERTAINTY_ZOOM_THRESHOLD) {
      return;
    }

    userLocations.forEach((userLocation) => {
      if (!map.current) return;

      const circle = L.circle(
        [userLocation.location.lat, userLocation.location.lng],
        {
          radius: userLocation.uncertaintyRadius,
          color: "#5B21B6",
          fillColor: "#7C3AED",
          fillOpacity: 0.5,
          opacity: 0.7,
          weight: 1,
          interactive: false,
        },
      ).addTo(map.current);

      userLocationCirclesRef.current.push(circle);
    });
  }, [currentZoom, showUncertaintyOverlay, userLocations]);

  useEffect(() => {
    if (!showCenteredMessage) return;

    const timeout = setTimeout(() => {
      setShowCenteredMessage(false);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [showCenteredMessage]);

  useEffect(() => {
    if (!currentPosition) return;

    renderUserLocationMarker(currentPosition.lat, currentPosition.lng);
    if (followMode && map.current) {
      recenterMapTo(
        currentPosition.lat,
        currentPosition.lng,
        map.current.getZoom(),
      );
    }
  }, [currentPosition, followMode, recenterMapTo, renderUserLocationMarker]);

  useEffect(() => {
    if (hasAutoLocatedRef.current) return;
    hasAutoLocatedRef.current = true;

    setFollowMode(true);

    const run = async () => {
      const position = await requestCurrentPosition();
      if (!position) return;

      renderUserLocationMarker(position.lat, position.lng);
      recenterMapTo(position.lat, position.lng, DEFAULT_ZOOM);
      setShowCenteredMessage(true);
    };

    void run();
  }, [
    recenterMapTo,
    renderUserLocationMarker,
    requestCurrentPosition,
    setFollowMode,
  ]);

  useEffect(() => {
    if (!followMode) {
      stopTracking();
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTracking();
        return;
      }
      startTracking();
    };

    if (document.hidden) {
      stopTracking();
    } else {
      startTracking();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopTracking();
    };
  }, [followMode, startTracking, stopTracking]);

  // Effect to handle observation markers
  useEffect(() => {
    if (!map.current) return;

    // Remove existing observation markers
    observationMarkersRef.current.forEach((marker) => marker.remove());
    observationMarkersRef.current = [];

    // Add markers for each observation
    observations.forEach((observation) => {
      if (map.current) {
        const marker = L.marker(
          [observation.location.lat, observation.location.lng],
          { icon: createObservationIconWithInitials(observation.observerName) },
        ).addTo(map.current);

        // Create popup content
        const speciesList = (observation.species || [])
          .map(
            (species) =>
              species.species.PrefferedPopularname ||
              species.species.ValidScientificName,
          )
          .join(", ");

        const speciesCount = observation.species?.length || 0;
        const speciesCountText =
          speciesCount === 1 ? "1 art" : `${speciesCount} arter`;

        const popupContent = `
          <div style="min-width: 150px;">
            <small style="color: #2F5D50; font-weight: 600;">${speciesCountText}</small><br/>
            <strong>${speciesList}</strong><br/>
            ${observation.startDate ? `<small>${new Date(observation.startDate).toLocaleDateString("no-NO")}</small><br/>` : ""}
            <small>±${observation.uncertaintyRadius}m</small>
          </div>
        `;

        marker.bindPopup(popupContent);

        // Add click handler to open edit form
        marker.on("click", () => {
          if (onObservationClick) {
            onObservationClick(observation.id);
          }
        });

        observationMarkersRef.current.push(marker);
      }
    });
  }, [observations, onObservationClick]);

  // Effect to handle user location markers
  useEffect(() => {
    if (!map.current) return;

    // Count observations per location
    const obsCountByLocation = new globalThis.Map<string, number>();
    for (const obs of observations) {
      if (obs.locationId) {
        obsCountByLocation.set(
          obs.locationId,
          (obsCountByLocation.get(obs.locationId) || 0) + 1,
        );
      }
    }

    // Remove existing user location markers
    userLocationsMarkersRef.current.forEach((marker) => marker.remove());
    userLocationsMarkersRef.current = [];

    // Add markers for each user location
    userLocations.forEach((userLoc) => {
      if (map.current) {
        const marker = L.marker([userLoc.location.lat, userLoc.location.lng], {
          icon: UserLocationIcon,
        }).addTo(map.current);

        // Create popup content with observation count
        const obsCount = obsCountByLocation.get(userLoc.id || "") || 0;
        const obsCountText =
          obsCount === 1 ? "1 observasjon" : `${obsCount} observasjoner`;

        const popupContent = `
          <div style="min-width: 150px;">
            <strong>${userLoc.name}</strong><br/>
            ${userLoc.description ? `<small>${userLoc.description}</small><br/>` : ""}
            <small style="color: #7C3AED; font-weight: 500;">${obsCountText}</small><br/>
            <small>±${userLoc.uncertaintyRadius}m</small>
          </div>
        `;

        marker.bindPopup(popupContent);

        // Add click handler to create observation at this location
        marker.on("click", () => {
          if (onUserLocationClick) {
            onUserLocationClick(userLoc.id);
          }
        });

        userLocationsMarkersRef.current.push(marker);
      }
    });
  }, [userLocations, onUserLocationClick, observations]);

  // Effect to handle layer switching
  useEffect(() => {
    if (!map.current || !tileLayerRef.current) return;

    // Remove current layer
    tileLayerRef.current.remove();

    // Get tile layer configuration
    const { url, attribution } = getTileLayerConfig(currentLayer);

    // Add new layer
    tileLayerRef.current = L.tileLayer(url, {
      maxZoom: 20,
      maxNativeZoom: currentLayer === "standard" ? 18 : undefined,
      attribution,
    }).addTo(map.current);
  }, [currentLayer]);

  return (
    <div className="w-full h-[calc(100vh-80px)] relative flex-1 overflow-hidden bg-forest">
      {!isOnline && (
        <div className="absolute top-0 left-0 right-0 z-[600] bg-bark text-sand text-xs font-semibold text-center py-1 px-2 flex items-center justify-center gap-1">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
          Offline
          {pendingSyncCount > 0
            ? ` · ${pendingSyncCount} obs. venter synkronisering`
            : ""}
        </div>
      )}
      {/* Layer Control */}
      <div className="absolute top-md right-md z-[500] flex flex-col gap-2">
        <button
          onClick={() => setCurrentLayer("standard")}
          className={`px-3 py-2 rounded-lg shadow-custom-lg font-medium text-sm transition-all ${
            currentLayer === "standard"
              ? "bg-moss text-sand border-2 border-sand"
              : "bg-sand dark:bg-bark text-bark dark:text-sand border-2 border-moss hover:bg-moss dark:hover:bg-moss"
          }`}
          title="Standard kart"
        >
          Kartverket
        </button>
        <button
          onClick={() => setCurrentLayer("topo")}
          className={`px-3 py-2 rounded-lg shadow-custom-lg font-medium text-sm transition-all ${
            currentLayer === "topo"
              ? "bg-moss text-sand border-2 border-sand"
              : "bg-sand dark:bg-bark text-bark dark:text-sand border-2 border-moss hover:bg-moss dark:hover:bg-moss"
          }`}
          title="Standard kart"
        >
          Kart
        </button>
        <button
          onClick={() => setCurrentLayer("aerial")}
          className={`px-3 py-2 rounded-lg shadow-custom-lg font-medium text-sm transition-all ${
            currentLayer === "aerial"
              ? "bg-moss text-sand border-2 border-sand"
              : "bg-sand dark:bg-bark text-bark dark:text-sand border-2 border-moss hover:bg-moss dark:hover:bg-moss"
          }`}
          title="Flyfoto"
        >
          Flyfoto
        </button>
      </div>
      {isLocating && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[500] bg-sand dark:bg-[rgba(44,44,44,0.95)] p-lg rounded-lg shadow-custom-2xl flex flex-col items-center gap-md font-medium text-bark dark:text-sand border-2 border-moss">
          <div className="w-10 h-10 border-4 border-slate-border border-t-rust rounded-full animate-spin"></div>
          <span>Finner din posisjon...</span>
        </div>
      )}
      {locationError && (
        <div
          className={`absolute ${isOnline ? "top-md" : "top-[calc(1rem+26px)]"} left-1/2 -translate-x-1/2 z-[500] bg-sand dark:bg-[rgba(44,44,44,0.95)] p-md md:p-xl rounded-lg shadow-custom-xl flex items-start gap-sm text-sm md:text-base font-medium text-rust dark:text-rust animate-[slideDown_0.3s_ease] max-w-[90%] border-2 border-rust leading-relaxed`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{locationError}</span>
          <button
            onClick={clearLocationError}
            className="ml-2 text-rust underline underline-offset-2"
          >
            Lukk
          </button>
        </div>
      )}
      {showCenteredMessage && currentPosition && !selectedLocation && (
        <div
          className={`absolute ${isOnline ? "top-md" : "top-[calc(1rem+26px)]"} left-1/2 -translate-x-1/2 z-[500] bg-sand dark:bg-[rgba(44,44,44,0.95)] p-sm md:p-md px-lg md:px-xl rounded-lg shadow-custom-xl flex items-center gap-sm text-sm md:text-base font-semibold text-moss dark:text-moss animate-[slideDown_0.3s_ease] max-w-[90%] border-2 border-moss`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>Sentrert på din posisjon</span>
        </div>
      )}
      {/* Download area button */}
      <div className="absolute bottom-md left-md z-[500]">
        {downloadProgress ? (
          <div className="bg-sand dark:bg-bark text-bark dark:text-sand text-xs font-medium px-3 py-2 rounded-lg shadow-custom-lg border-2 border-moss flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-moss border-t-transparent rounded-full animate-spin" />
            {downloadProgress.done >= downloadProgress.total
              ? "Nedlasting fullført!"
              : `Laster ned… ${downloadProgress.done}/${downloadProgress.total}`}
          </div>
        ) : (
          <button
            onClick={downloadCurrentLayer}
            disabled={!isOnline}
            className="bg-sand dark:bg-bark text-bark dark:text-sand text-xs font-medium px-3 py-2 rounded-lg shadow-custom-lg border-2 border-moss hover:bg-moss dark:hover:bg-moss transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            title="Last ned kartfliser for dette området for offline bruk"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Last ned område
          </button>
        )}
      </div>
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full border-none rounded-t-lg overflow-hidden"
      />

      {/* Active medobservatør badge (above download button) */}
      {(() => {
        const medobs = localStorage.getItem("kikk-medobservator");
        if (!medobs) return null;
        return (
          <div className="absolute bottom-[calc(1rem+44px)] left-md z-[500] bg-forest/90 text-sand text-xs font-medium px-3 py-2 rounded-lg shadow-custom-lg flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
            <span className="max-w-[150px] truncate" title={medobs}>
              {medobs}
            </span>
          </div>
        );
      })()}
    </div>
  );
}

export default Map;
