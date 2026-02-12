import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with bundlers
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import {
  kartverketAttribution,
  kartverketTopo,
  mapboxAttribution,
  mapboxSatellite,
  mapboxTopo,
} from "../lib/mapUtils.ts";
import {
  createSelectionIcon,
  createUserLocationIcon,
} from "../lib/markerIcons.ts";
import { useMapPreferences } from "../context/MapPreferencesContext.tsx";
import { Button } from "./ui/button.tsx";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Create icon instance for editable positions
const EditableIcon = createSelectionIcon();
const UserLocationicon = createUserLocationIcon();

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

interface LocationEditorProps {
  location: { lat: number; lng: number };
  isPresetLocation?: boolean;
  onLocationChange: (lat: number, lng: number) => void;
  zoom?: number;
}

export const LocationEditor = ({
  location,
  isPresetLocation = false,
  onLocationChange,
  zoom = 13,
}: LocationEditorProps) => {
  const [hidden, setHidden] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { currentLayer } = useMapPreferences();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map centered on the location with the specified zoom
    map.current = L.map(mapContainer.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([location.lat, location.lng], zoom);

    // Get tile layer configuration
    const { url, attribution } = getTileLayerConfig(currentLayer);
    // Add tiles
    tileLayerRef.current = L.tileLayer(url, {
      maxZoom: 19,
      attribution,
    }).addTo(map.current);

    // Add draggable marker
    markerRef.current = L.marker([location.lat, location.lng], {
      icon: isPresetLocation ? UserLocationicon : EditableIcon,
      draggable: true,
    }).addTo(map.current);

    if (!isPresetLocation) {
      markerRef.current.on("dragend", () => {
        if (markerRef.current) {
          const newPos = markerRef.current.getLatLng();
          onLocationChange(newPos.lat, newPos.lng);
        }
      });

      map.current.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        onLocationChange(lat, lng);
      });
    }

    // Ensure the map container is properly sized
    // This delay allows the DOM to fully render before invalidating size
    setTimeout(() => {
      if (map.current) {
        map.current.invalidateSize();
      }
    }, 100);

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
      if (tileLayerRef.current) {
        tileLayerRef.current = null;
      }
    };
    // Empty deps: only initialize once on mount. location/onLocationChange handled by separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker position when location prop changes externally
  useEffect(() => {
    if (markerRef.current && map.current) {
      markerRef.current.setLatLng([location.lat, location.lng]);
      map.current.setView([location.lat, location.lng], map.current.getZoom());
    }
  }, [location.lat, location.lng]);

  return (
    <div>
      <p className="text-sm text-slate mt-1 mb-2">
        Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
      </p>
      <div
        className={`w-full ${hidden ? "h-[60px]" : "h-[300px]"} rounded-md overflow-hidden border-2 border-moss relative`}
      >
        <Button
          className={"absolute top-2 right-2 z-[1000]"}
          variant={"secondary"}
          onClick={(e) => {
            e.preventDefault();
            setHidden(!hidden);
          }}
        >
          {hidden ? "Ekspander" : "Kollaps"}
        </Button>
        <div ref={mapContainer} className="w-full h-full" />
        {!hidden && (
          <div className="absolute bottom-2 right-2 z-[1000] bg-sand dark:bg-bark px-2 py-1 rounded text-xs text-bark dark:text-sand shadow-md border border-moss/30">
            {isPresetLocation
              ? "Låst til forhåndsinnstilt lokalitet"
              : "Dra markøren eller klikk for å justere posisjon"}
          </div>
        )}
      </div>
    </div>
  );
};
