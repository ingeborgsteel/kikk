import {useEffect, useRef, useState} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {Observation} from "./types/observation";

// Fix for default marker icons in Leaflet with bundlers
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Create a different icon for existing observations
const ObservationIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'observation-marker',
});

L.Marker.prototype.options.icon = DefaultIcon;

// Delay for map resize after initialization to ensure container dimensions are available
const MAP_RESIZE_DELAY_MS = 100;

interface MapProps {
  onLocationSelect?: (lat: number, lng: number) => void;
  observations?: Observation[];
}

function Map({onLocationSelect, observations = []}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const observationMarkersRef = useRef<L.Marker[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with default center (Norway)
    const defaultCenter: [number, number] = [60.472, 8.4689];
    const defaultZoom = 6;

    map.current = L.map(mapContainer.current).setView(defaultCenter, defaultZoom);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map.current);

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
      const {lat, lng} = e.latlng;
      setSelectedLocation({lat, lng});

      // Remove existing marker if any
      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Add new marker at clicked location
      if (map.current) {
        markerRef.current = L.marker([lat, lng]).addTo(map.current);
      }

      // Call callback if provided
      if (onLocationSelect) {
        onLocationSelect(lat, lng);
      }
    });

    // Try to get user's current location
    if ("geolocation" in navigator) {
      setIsLocating(true);
      setLocationError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const {latitude, longitude} = position.coords;
          setUserLocation({lat: latitude, lng: longitude});
          if (mapInstance) {
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
              errorMessage = "Plasseringstillatelse nektet. Vennligst aktiver posisjonstilgang i nettleserinnstillingene dine.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Posisjonsinformasjon er ikke tilgjengelig.";
              break;
            case error.TIMEOUT:
              errorMessage = "Posisjonsforespørsel tidsavbrutt. Vennligst prøv igjen.";
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
        markerRef.current = null;
      }
      observationMarkersRef.current = [];
    };
  }, [onLocationSelect]);

  // Effect to handle observation markers
  useEffect(() => {
    if (!map.current) return;

    // Remove existing observation markers
    observationMarkersRef.current.forEach(marker => marker.remove());
    observationMarkersRef.current = [];

    // Add markers for each observation
    observations.forEach((observation) => {
      if (map.current) {
        const marker = L.marker(
          [observation.location.lat, observation.location.lng],
          { icon: ObservationIcon }
        ).addTo(map.current);

        // Create popup content
        const speciesList = observation.speciesObservations
          .map(so => so.species.PrefferedPopularname || so.species.ValidScientificName)
          .join(', ');
        
        const popupContent = `
          <div style="min-width: 150px;">
            <strong>${speciesList}</strong><br/>
            <small>${new Date(observation.date).toLocaleDateString('no-NO')}</small><br/>
            <small>±${observation.uncertaintyRadius}m</small>
          </div>
        `;
        
        marker.bindPopup(popupContent);

        observationMarkersRef.current.push(marker);
      }
    });
  }, [observations]);

  return (
    <div className="w-full h-[calc(100vh-80px)] relative flex-1 overflow-hidden bg-forest">
      {isLocating && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2000] bg-sand dark:bg-[rgba(44,44,44,0.95)] p-lg rounded-lg shadow-custom-2xl flex flex-col items-center gap-md font-medium text-bark dark:text-sand border-2 border-moss">
          <div className="w-10 h-10 border-4 border-slate-border border-t-rust rounded-full animate-spin"></div>
          <span>Finner din posisjon...</span>
        </div>
      )}
      {locationError && (
        <div
          className="absolute top-md left-1/2 -translate-x-1/2 z-[1000] bg-sand dark:bg-[rgba(44,44,44,0.95)] p-md md:p-xl rounded-lg shadow-custom-xl flex items-start gap-sm text-sm md:text-base font-medium text-rust dark:text-rust animate-[slideDown_0.3s_ease] max-w-[90%] border-2 border-rust leading-relaxed">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{locationError}</span>
        </div>
      )}
      {userLocation && !selectedLocation && (
        <div
          className="absolute top-md left-1/2 -translate-x-1/2 z-[1000] bg-sand dark:bg-[rgba(44,44,44,0.95)] p-sm md:p-md px-lg md:px-xl rounded-lg shadow-custom-xl flex items-center gap-sm text-sm md:text-base font-semibold text-moss dark:text-moss animate-[slideDown_0.3s_ease] max-w-[90%] border-2 border-moss">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0"
          >
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          <span>Sentrert på din posisjon</span>
        </div>
      )}
      {selectedLocation && (
        <div
          className="absolute top-md left-1/2 -translate-x-1/2 z-[1000] bg-sand dark:bg-[rgba(44,44,44,0.95)] p-sm md:p-md px-lg md:px-xl rounded-lg shadow-custom-xl flex items-center gap-sm text-sm md:text-base font-semibold text-bark dark:text-sand animate-[slideDown_0.3s_ease] max-w-[90%] border-2 border-moss">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-rust shrink-0"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>
						{selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
					</span>
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full border-none rounded-t-lg overflow-hidden"/>
    </div>
  );
}

export default Map;
