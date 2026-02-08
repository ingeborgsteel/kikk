import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with bundlers
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Create custom SVG marker for rust color (editable position)
const createRustMarkerSVG = () => {
  const svg = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.4 12.5 28.5 12.5 28.5S25 20.9 25 12.5C25 5.6 19.4 0 12.5 0z" 
            fill="#C76D4B" stroke="#8B4513" stroke-width="1"/>
      <circle cx="12.5" cy="12.5" r="4" fill="#FFF" opacity="0.3"/>
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const EditableIcon = L.icon({
  iconUrl: createRustMarkerSVG(),
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationEditorProps {
  location: { lat: number; lng: number };
  onLocationChange: (lat: number, lng: number) => void;
}

export const LocationEditor = ({ location, onLocationChange }: LocationEditorProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map centered on the location
    map.current = L.map(mapContainer.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([location.lat, location.lng], 13);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
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
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
      onLocationChange(lat, lng);
    });

    // Ensure the map container is properly sized
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
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute bottom-2 right-2 z-[1000] bg-sand dark:bg-bark px-2 py-1 rounded text-xs text-bark dark:text-sand shadow-md border border-moss/30">
        Dra markøren eller klikk for å justere posisjon
      </div>
    </div>
  );
};
