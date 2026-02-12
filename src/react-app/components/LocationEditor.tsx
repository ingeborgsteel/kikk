import {useEffect, useRef} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with bundlers
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import {kartverketAttribution, kartverketTopo, mapboxAttribution, mapboxSatellite, mapboxTopo} from "../lib/mapUtils.ts";
import {createSelectionIcon} from "../lib/markerIcons.ts";
import {useMapPreferences} from "../context/MapPreferencesContext.tsx";

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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const {currentLayer} = useMapPreferences();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map centered on the location with the specified zoom
    map.current = L.map(mapContainer.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([location.lat, location.lng], zoom);

    // Determine tile layer based on current preference
    let tileUrl = '';
    let attribution = '';

    switch (currentLayer) {
      case 'aerial':
        tileUrl = mapboxSatellite;
        attribution = mapboxAttribution;
        break;
      case 'topo':
        tileUrl = mapboxTopo;
        attribution = mapboxAttribution;
        break;
      default:
        tileUrl = kartverketTopo;
        attribution = kartverketAttribution;
        break;
    }

    // Add tiles
    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution
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
      if (tileLayerRef.current) {
        tileLayerRef.current = null;
      }
    };
    // Empty deps: only initialize once on mount. location/onLocationChange handled by separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update tile layer when currentLayer preference changes
  useEffect(() => {
    if (!map.current || !tileLayerRef.current) return;

    // Remove current layer
    tileLayerRef.current.remove();

    // Add new layer based on selection
    let tileUrl = '';
    let attribution = '';

    switch (currentLayer) {
      case 'aerial':
        tileUrl = mapboxSatellite;
        attribution = mapboxAttribution;
        break;
      case 'topo':
        tileUrl = mapboxTopo;
        attribution = mapboxAttribution;
        break;
      default:
        tileUrl = kartverketTopo;
        attribution = kartverketAttribution;
        break;
    }

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution,
    }).addTo(map.current);
  }, [currentLayer]);

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
