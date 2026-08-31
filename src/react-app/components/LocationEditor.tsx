import { useEffect, useRef, useState } from "react";
import L from "leaflet";

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
import { cn } from "../lib/utils.ts";
import { Maximize2, Minimize2 } from "lucide-react";

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
  uncertaintyRadius?: number | null;
  isPresetLocation?: boolean;
  onLocationChange: (lat: number, lng: number) => void;
  zoom?: number;
  compact?: boolean;
  onToggleExpandCallback?: () => void;
}

export const LocationEditor = ({
  location,
  uncertaintyRadius,
  isPresetLocation = false,
  onLocationChange,
  zoom = 13,
  compact = false,
  onToggleExpandCallback,
}: LocationEditorProps) => {
  const [hidden, setHidden] = useState(compact);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { currentLayer } = useMapPreferences();
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map centered on the location with the specified zoom
    const previewZoom = Math.max(3, zoom - 7);
    const initialZoom = hidden ? previewZoom : zoom;
    map.current = L.map(mapContainer.current, {
      zoomControl: !hidden,
      attributionControl: false,
    }).setView([location.lat, location.lng], initialZoom);

    // Get tile layer configuration
    const { url, attribution } = getTileLayerConfig(currentLayer);
    // Add tiles
    tileLayerRef.current = L.tileLayer(url, {
      maxZoom: 19,
      maxNativeZoom: 18,
      attribution,
    }).addTo(map.current);

    // Add marker (draggable only in the full editor)
    markerRef.current = L.marker([location.lat, location.lng], {
      icon: isPresetLocation ? UserLocationicon : EditableIcon,
      draggable: !isPresetLocation && !hidden,
    }).addTo(map.current);

    if (typeof uncertaintyRadius === "number" && uncertaintyRadius > 0) {
      circleRef.current = L.circle([location.lat, location.lng], {
        radius: uncertaintyRadius,
        color: isPresetLocation ? "#5B21B6" : "#8B4513",
        fillColor: isPresetLocation ? "#7C3AED" : "#C76D4B",
        fillOpacity: 0.16,
        opacity: 0.8,
        weight: 1,
        interactive: false,
      }).addTo(map.current);
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
      if (circleRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
      if (tileLayerRef.current) {
        tileLayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manage map size, interactions and event listeners based on hidden/expanded state
  useEffect(() => {
    if (!map.current) return;
    const m = map.current;
    const marker = markerRef.current;
    const targetZoom = hidden ? Math.max(3, zoom - 7) : zoom;

    const handleDragEnd = () => {
      if (marker) {
        const newPos = marker.getLatLng();
        onLocationChangeRef.current(newPos.lat, newPos.lng);
      }
    };

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (marker) {
        marker.setLatLng([lat, lng]);
      }
      onLocationChangeRef.current(lat, lng);
    };

    if (!isPresetLocation && !hidden) {
      marker?.on("dragend", handleDragEnd);
      m.on("click", handleMapClick);

      m.dragging?.enable();
      m.touchZoom?.enable();
      m.doubleClickZoom?.enable();
      m.scrollWheelZoom?.enable();
      m.boxZoom?.enable();
      m.keyboard?.enable();
      m.zoomControl?.addTo(m);
      marker?.dragging?.enable();
    } else {
      m.dragging?.disable();
      m.touchZoom?.disable();
      m.doubleClickZoom?.disable();
      m.scrollWheelZoom?.disable();
      m.boxZoom?.disable();
      m.keyboard?.disable();
      m.zoomControl?.remove();
      marker?.dragging?.disable();
    }

    m.setZoom(targetZoom);

    setTimeout(() => {
      m.invalidateSize();
    }, 0);

    return () => {
      marker?.off("dragend", handleDragEnd);
      m.off("click", handleMapClick);
    };
  }, [hidden, isPresetLocation, zoom]);

  // Update marker position when location prop changes externally
  useEffect(() => {
    if (markerRef.current && map.current) {
      markerRef.current.setLatLng([location.lat, location.lng]);
      if (circleRef.current) {
        circleRef.current.setLatLng([location.lat, location.lng]);
      }
      map.current.setView([location.lat, location.lng], map.current.getZoom());
    }
  }, [location.lat, location.lng]);

  useEffect(() => {
    if (!map.current) return;

    if (typeof uncertaintyRadius !== "number" || uncertaintyRadius <= 0) {
      if (circleRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
      return;
    }

    if (!circleRef.current) {
      circleRef.current = L.circle([location.lat, location.lng], {
        radius: uncertaintyRadius,
        color: isPresetLocation ? "#5B21B6" : "#8B4513",
        fillColor: isPresetLocation ? "#7C3AED" : "#C76D4B",
        fillOpacity: 0.16,
        opacity: 0.8,
        weight: 1,
        interactive: false,
      }).addTo(map.current);
      return;
    }

    circleRef.current.setRadius(uncertaintyRadius);
  }, [isPresetLocation, location.lat, location.lng, uncertaintyRadius]);

  return (
    <div>
      {!compact && (
        <p className="text-sm text-slate mt-1 mb-2">
          Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
        </p>
      )}
      <div
        className={cn(
          "w-full rounded-md overflow-hidden border-2 border-moss relative flex-1",
          compact ? "h-16" : hidden ? "h-[60px]" : "h-[300px]",
        )}
      >
        <Button
          type="button"
          size={"icon"}
          variant="outline"
          aria-label={hidden ? "Vis kart" : "Skjul kart"}
          className={cn(
            "absolute z-[600] bg-white/90 dark:bg-bark/90 shadow-sm",
            compact ? "top-1 right-1" : "top-2 right-2",
          )}
          onClick={(e) => {
            e.preventDefault();
            setHidden(!hidden);
            onToggleExpandCallback?.();
          }}
        >
          {hidden ? <Maximize2 size={16} /> : <Minimize2 size={18} />}
        </Button>
        <div ref={mapContainer} className="w-full h-full" />
        {!hidden && (
          <div className="absolute bottom-2 right-2 z-[100] bg-sand dark:bg-bark px-2 py-1 rounded text-xs text-bark dark:text-sand shadow-md border border-moss/30">
            {isPresetLocation
              ? "Låst til standardlokalitet"
              : "Dra markøren eller klikk for å justere posisjon"}
          </div>
        )}
      </div>
    </div>
  );
};
