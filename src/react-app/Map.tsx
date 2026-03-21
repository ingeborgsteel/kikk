import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import { Observation } from "./types/observation";
import { UserLocation } from "./types/location";

// Norwegian localization for Leaflet.Draw tooltips
L.drawLocal.draw.handlers.polygon.tooltip.start = "Klikk for å begynne å tegne område.";
L.drawLocal.draw.handlers.polygon.tooltip.cont = "Klikk for å fortsette å tegne område.";
L.drawLocal.draw.handlers.polygon.tooltip.end =
  "Klikk på første punkt for å lukke området.";

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
import { isValidPolygon } from "./lib/utils.ts";
import {
  createObservationIcon,
  createSelectionIcon,
  createUserLocationIcon,
} from "./lib/markerIcons.ts";
import { useMapPreferences } from "./context/MapPreferencesContext.tsx";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Create icon instances for use in the map
const SelectionIcon = createSelectionIcon();
const ObservationIcon = createObservationIcon();
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

interface MapProps {
  onLocationSelect?: (lat: number, lng: number, zoom: number) => void;
  onAreaSelect?: (
    area: [number, number][],
    center: { lat: number; lng: number },
    zoom: number,
  ) => void;
  observations?: Observation[];
  onObservationClick?: (observationId: string) => void;
  userLocations?: UserLocation[];
  onUserLocationClick?: (locationId: string) => void;
}

function Map({
  onLocationSelect,
  onAreaSelect,
  observations = [],
  onObservationClick,
  userLocations = [],
  onUserLocationClick,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  const onAreaSelectRef = useRef(onAreaSelect);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const observationMarkersRef = useRef<L.Marker[]>([]);
  const observationPolygonsRef = useRef<L.Polygon[]>([]);
  const userLocationsMarkersRef = useRef<L.Marker[]>([]);
  const userLocationMarkerRef = useRef<L.CircleMarker | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const { currentLayer, setCurrentLayer } = useMapPreferences();
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawHandlerRef = useRef<L.Draw.Polygon | null>(null);

  // Update the ref whenever onLocationSelect changes
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Update the ref whenever onAreaSelect changes
  useEffect(() => {
    onAreaSelectRef.current = onAreaSelect;
  }, [onAreaSelect]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with default center (Oslo, Norway)
    const defaultCenter: [number, number] = [59.9139, 10.7522];
    const defaultZoom = 12;

    map.current = L.map(mapContainer.current).setView(
      defaultCenter,
      defaultZoom,
    );

    // Add initial tile layer (standard OpenStreetMap)
    tileLayerRef.current = L.tileLayer(kartverketTopo, {
      maxZoom: 19,
      attribution: kartverketAttribution,
    }).addTo(map.current);

    // Handle polygon draw completion
    map.current.on(L.Draw.Event.CREATED, (e: L.LeafletEvent) => {
      const event = e as L.DrawEvents.Created;
      const layer = event.layer as L.Polygon;
      const latlngs = (layer.getLatLngs()[0] as L.LatLng[]).map(
        (ll) => [ll.lat, ll.lng] as [number, number],
      );

      // Calculate centroid of the polygon
      const centroid = latlngs.reduce(
        (acc, [lat, lng]) => ({
          lat: acc.lat + lat / latlngs.length,
          lng: acc.lng + lng / latlngs.length,
        }),
        { lat: 0, lng: 0 },
      );

      setSelectedLocation(centroid);
      setIsDrawing(false);

      if (onAreaSelectRef.current && map.current) {
        const currentZoom = map.current.getZoom();
        onAreaSelectRef.current(latlngs, centroid, currentZoom);
      }
    });

    // Handle draw stop (cancel)
    map.current.on(L.Draw.Event.DRAWSTOP, () => {
      setIsDrawing(false);
    });

    // Ensure the map container is properly sized
    // This is necessary when the container size is not immediately available
    setTimeout(() => {
      if (map.current) {
        map.current.invalidateSize();
      }
    }, MAP_RESIZE_DELAY_MS);

    // Add click handler to select location
    const mapInstance = map.current;
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

    // Try to get user's current location
    if ("geolocation" in navigator) {
      setIsLocating(true);
      setLocationError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });

          // Add blue dot for user location
          if (mapInstance) {
            // Remove existing user location marker if any
            if (userLocationMarkerRef.current) {
              userLocationMarkerRef.current.remove();
            }

            // Create blue dot with white border
            userLocationMarkerRef.current = L.circleMarker(
              [latitude, longitude],
              {
                radius: 8,
                fillColor: "#4285F4",
                color: "#ffffff",
                weight: 2,
                opacity: 1,
                fillOpacity: 1,
              },
            ).addTo(mapInstance);

            mapInstance.setView([latitude, longitude], 13);
          }
          setIsLocating(false);

          // Auto-dismiss success message after 4 seconds
          setTimeout(() => {
            setUserLocation(null);
          }, 4000);
        },
        (error) => {
          let errorMessage = "Kunne ikke finne din posisjon";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Plasseringstillatelse nektet. Vennligst aktiver posisjonstilgang i nettleserinnstillingene dine.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Posisjonsinformasjon er ikke tilgjengelig.";
              break;
            case error.TIMEOUT:
              errorMessage =
                "Posisjonsforespørsel tidsavbrutt. Vennligst prøv igjen.";
              break;
          }
          console.log("Geolocation error:", error.message);
          setLocationError(errorMessage);
          setIsLocating(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    } else {
      setLocationError("Geolokalisering støttes ikke av nettleseren din.");
    }

    // Cleanup
    return () => {
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
      drawHandlerRef.current = null;
      observationMarkersRef.current = [];
      observationPolygonsRef.current = [];
      userLocationsMarkersRef.current = [];
    };
  }, []);

  // Effect to handle observation markers and polygons
  useEffect(() => {
    if (!map.current) return;

    // Remove existing observation markers and polygons
    observationMarkersRef.current.forEach((marker) => marker.remove());
    observationMarkersRef.current = [];
    observationPolygonsRef.current.forEach((polygon) => polygon.remove());
    observationPolygonsRef.current = [];

    // Add markers (and polygons) for each observation
    observations.forEach((observation) => {
      if (map.current) {
        const marker = L.marker(
          [observation.location.lat, observation.location.lng],
          { icon: ObservationIcon },
        ).addTo(map.current);

        // Create popup content
        const speciesList = (observation.species || [])
          .map(
            (species) =>
              species.species.PrefferedPopularname ||
              species.species.ValidScientificName,
          )
          .join(", ");

        const popupContent = `
          <div style="min-width: 150px;">
            <strong>${speciesList}</strong><br/>
            <small>${new Date(observation.startDate).toLocaleDateString("no-NO")}</small><br/>
            <small>±${observation.uncertaintyRadius}m</small>
            ${observation.area ? '<br/><small style="color: #2F5D50; font-weight: 600;">▣ Område tegnet</small>' : ""}
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

        // Draw polygon if observation has an area
        if (isValidPolygon(observation.area) && map.current) {
          const polygon = L.polygon(
            observation.area.map(([lat, lng]) => [lat, lng] as L.LatLngTuple),
            {
              color: "#2F5D50",
              fillColor: "#2F5D50",
              fillOpacity: 0.15,
              weight: 2,
            },
          ).addTo(map.current);

          polygon.on("click", () => {
            if (onObservationClick) {
              onObservationClick(observation.id);
            }
          });

          observationPolygonsRef.current.push(polygon);
        }
      }
    });
  }, [observations, onObservationClick]);

  // Effect to handle user location markers
  useEffect(() => {
    if (!map.current) return;

    // Remove existing user location markers
    userLocationsMarkersRef.current.forEach((marker) => marker.remove());
    userLocationsMarkersRef.current = [];

    // Add markers for each user location
    userLocations.forEach((userLoc) => {
      if (map.current) {
        const marker = L.marker([userLoc.location.lat, userLoc.location.lng], {
          icon: UserLocationIcon,
        }).addTo(map.current);

        // Create popup content
        const popupContent = `
          <div style="min-width: 150px;">
            <strong>${userLoc.name}</strong><br/>
            ${userLoc.description ? `<small>${userLoc.description}</small><br/>` : ""}
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
  }, [userLocations, onUserLocationClick]);

  // Effect to handle layer switching
  useEffect(() => {
    if (!map.current || !tileLayerRef.current) return;

    // Remove current layer
    tileLayerRef.current.remove();

    // Get tile layer configuration
    const { url, attribution } = getTileLayerConfig(currentLayer);

    // Add new layer
    tileLayerRef.current = L.tileLayer(url, {
      maxZoom: 19,
      attribution,
    }).addTo(map.current);
  }, [currentLayer]);

  // Toggle polygon drawing mode
  const toggleDrawing = () => {
    if (!map.current) return;

    if (isDrawing && drawHandlerRef.current) {
      // Cancel current drawing
      drawHandlerRef.current.disable();
      drawHandlerRef.current = null;
      setIsDrawing(false);
    } else {
      // Start drawing polygon
      const handler = new L.Draw.Polygon(map.current as L.DrawMap, {
        shapeOptions: {
          color: "#C76D4B",
          fillColor: "#C76D4B",
          fillOpacity: 0.2,
          weight: 2,
        },
      });
      handler.enable();
      drawHandlerRef.current = handler;
      setIsDrawing(true);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-80px)] relative flex-1 overflow-hidden bg-forest">
      {/* Layer Control */}
      <div className="absolute top-md right-md z-[1000] flex flex-col gap-2">
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
      {/* Draw Area Button */}
      <div className="absolute top-[100px] left-[10px] z-[1000]">
        <button
          onClick={toggleDrawing}
          className={`px-3 py-2 rounded-lg shadow-custom-lg font-medium text-sm transition-all flex items-center gap-1.5 ${
            isDrawing
              ? "bg-rust text-sand border-2 border-sand"
              : "bg-sand dark:bg-bark text-bark dark:text-sand border-2 border-moss hover:bg-moss dark:hover:bg-moss"
          }`}
          title={isDrawing ? "Avbryt tegning" : "Tegn område"}
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
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          </svg>
          {isDrawing ? "Avbryt" : "Tegn område"}
        </button>
      </div>
      {isDrawing && (
        <div className="absolute top-[145px] left-[10px] z-[1000] bg-sand dark:bg-[rgba(44,44,44,0.95)] px-3 py-2 rounded-lg shadow-custom-lg text-xs text-bark dark:text-sand border border-moss/30 max-w-[200px]">
          Klikk på kartet for å sette hjørnepunkter. Klikk på første punkt eller dobbeltklikk for å fullføre.
        </div>
      )}
      {isLocating && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2000] bg-sand dark:bg-[rgba(44,44,44,0.95)] p-lg rounded-lg shadow-custom-2xl flex flex-col items-center gap-md font-medium text-bark dark:text-sand border-2 border-moss">
          <div className="w-10 h-10 border-4 border-slate-border border-t-rust rounded-full animate-spin"></div>
          <span>Finner din posisjon...</span>
        </div>
      )}
      {locationError && (
        <div className="absolute top-md left-1/2 -translate-x-1/2 z-[1000] bg-sand dark:bg-[rgba(44,44,44,0.95)] p-md md:p-xl rounded-lg shadow-custom-xl flex items-start gap-sm text-sm md:text-base font-medium text-rust dark:text-rust animate-[slideDown_0.3s_ease] max-w-[90%] border-2 border-rust leading-relaxed">
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
        </div>
      )}
      {userLocation && !selectedLocation && (
        <div className="absolute top-md left-1/2 -translate-x-1/2 z-[1000] bg-sand dark:bg-[rgba(44,44,44,0.95)] p-sm md:p-md px-lg md:px-xl rounded-lg shadow-custom-xl flex items-center gap-sm text-sm md:text-base font-semibold text-moss dark:text-moss animate-[slideDown_0.3s_ease] max-w-[90%] border-2 border-moss">
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
      {selectedLocation && (
        <div className="absolute top-md left-1/2 -translate-x-1/2 z-[1000] bg-sand dark:bg-[rgba(44,44,44,0.95)] p-sm md:p-md px-lg md:px-xl rounded-lg shadow-custom-xl flex items-center gap-sm text-sm md:text-base font-semibold text-bark dark:text-sand animate-[slideDown_0.3s_ease] max-w-[90%] border-2 border-moss">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-rust shrink-0"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>
            {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
          </span>
        </div>
      )}
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full border-none rounded-t-lg overflow-hidden"
      />
    </div>
  );
}

export default Map;
