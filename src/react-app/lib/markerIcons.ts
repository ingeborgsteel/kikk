import L from "leaflet";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

/**
 * Creates a custom SVG marker icon with the specified color.
 * @param fillColor - The fill color for the marker
 * @param strokeColor - The stroke color for the marker
 * @returns Data URL for the SVG marker
 */
const createMarkerSVG = (fillColor: string, strokeColor: string): string => {
  const svg = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.4 12.5 28.5 12.5 28.5S25 20.9 25 12.5C25 5.6 19.4 0 12.5 0z" 
            fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>
      <circle cx="12.5" cy="12.5" r="4" fill="#FFF" opacity="0.3"/>
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

/**
 * Create custom SVG marker for rust color (editable/selection marker).
 * Used for: new selections, editable positions in forms
 */
export const createRustMarkerSVG = () => {
  return createMarkerSVG("#C76D4B", "#8B4513");
};

/**
 * Create custom SVG marker for forest green (existing observations).
 * Used for: observation markers on the map
 */
export const createForestGreenMarkerSVG = () => {
  return createMarkerSVG("#2F5D50", "#1a3d32");
};

/**
 * Create custom SVG marker for user locations (purple/blue color).
 * Used for: saved user location markers
 */
export const createUserLocationMarkerSVG = () => {
  return createMarkerSVG("#7C3AED", "#5B21B6");
};

/**
 * Creates a Leaflet icon for the rust/selection marker.
 */
export const createSelectionIcon = () => {
  return L.icon({
    iconUrl: createRustMarkerSVG(),
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });
};

/**
 * Creates a Leaflet icon for observation markers.
 */
export const createObservationIcon = () => {
  return L.icon({
    iconUrl: createForestGreenMarkerSVG(),
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });
};

/**
 * Creates a Leaflet icon for user location markers.
 */
export const createUserLocationIcon = () => {
  return L.icon({
    iconUrl: createUserLocationMarkerSVG(),
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });
};
