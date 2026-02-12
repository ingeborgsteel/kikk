import {useEffect, useRef} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with bundlers
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import {mapboxAttribution, mapboxTopo} from "../lib/mapUtils.ts";
import {createSelectionIcon} from "../lib/markerIcons.ts";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Create icon instance for editable positions
const EditableIcon = createSelectionIcon();

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationEditorProps {
  location: { lat: number; lng: number };
  onLocationChange: (lat: number, lng: number) => void;
  zoom?: number;
}

export const LocationEditor = ({location, onLocationChange, zoom = 13}: LocationEditorProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map centered on the location with the specified zoom
    map.current = L.map(mapContainer.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([location.lat, location.lng], zoom);

    // Add OpenStreetMap tiles
    L.tileLayer(mapboxTopo, {
      maxZoom: 19,
      attribution: mapboxAttribution
    }).addTo(map.current);

    // Add draggable marker
    markerRef.current = L.marker([location.lat, location.lng], {
      icon: EditableIcon,
      draggable: true,
    }).addTo(map.current);

    // Handle marker drag
    markerRef.current.on('dragend', () => {
      if (markerRef.current) {
        const newPos = markerRef.current.getLatLng();
        onLocationChange(newPos.lat, newPos.lng);
      }
    });

    // Add click handler to reposition marker
    map.current.on('click', (e: L.LeafletMouseEvent) => {
      const {lat, lng} = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
      onLocationChange(lat, lng);
    });

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
    <div className="w-full h-[300px] rounded-md overflow-hidden border-2 border-moss relative">
      <div ref={mapContainer} className="w-full h-full"/>
      <div
        className="absolute bottom-2 right-2 z-[1000] bg-sand dark:bg-bark px-2 py-1 rounded text-xs text-bark dark:text-sand shadow-md border border-moss/30">
        Dra markøren eller klikk for å justere posisjon
      </div>
    </div>
  );
};
