import L from "leaflet";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

/**
 * Extracts initials from a name.
 * - If the name looks like initials already (1-3 uppercase letters, possibly separated by dots or spaces), returns the full name
 * - Otherwise, takes the first letter of each word (John Doe → JD)
 * - Limited to 2-3 characters max for display
 */
export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";

  // Check if it looks like initials already (e.g., "AB", "A.B.", "A B", "ABC")
  const looksLikeInitials = /^[A-ZÆØÅ][.\s]?[A-ZÆØÅ]?[.\s]?[A-ZÆØÅ]?\.?$/.test(
    trimmed,
  );
  if (looksLikeInitials && trimmed.length <= 5) {
    // Return clean version without dots/spaces for display
    return trimmed.replace(/[.\s]/g, "").toUpperCase().slice(0, 3);
  }

  // Take first letter of each word
  const words = trimmed.split(/\s+/);
  const initials = words
    .map((word) => word[0]?.toUpperCase())
    .filter(Boolean)
    .join("");

  // Limit to 2-3 characters
  return initials.slice(0, 3);
}

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
 * Creates an SVG marker with initials text overlaid.
 */
const createMarkerSVGWithInitials = (
  fillColor: string,
  strokeColor: string,
  initials: string,
): string => {
  const displayText = initials.slice(0, 3).toUpperCase();
  const fontSize =
    displayText.length === 1 ? 10 : displayText.length === 2 ? 9 : 7;
  const yOffset = displayText.length <= 2 ? 13.5 : 14;

  const svg = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.4 12.5 28.5 12.5 28.5S25 20.9 25 12.5C25 5.6 19.4 0 12.5 0z" 
            fill="${fillColor}" stroke="${strokeColor}" stroke-width="1"/>
      <circle cx="12.5" cy="12.5" r="4" fill="#FFF" opacity="0.3"/>
      <text x="12.5" y="${yOffset}" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="${fontSize}" 
            font-weight="bold"
            fill="white" 
            text-anchor="middle"
            dominant-baseline="middle">${displayText}</text>
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
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
 * Creates a Leaflet icon for observation markers with initials.
 */
export const createObservationIconWithInitials = (
  observerName: string | undefined,
) => {
  const initials = observerName ? getInitials(observerName) : "";
  return L.icon({
    iconUrl: createMarkerSVGWithInitials("#2F5D50", "#1a3d32", initials),
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
