import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Map.css";

// Fix for default marker icons in Leaflet with bundlers
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
	iconUrl: icon,
	shadowUrl: iconShadow,
	iconSize: [25, 41],
	iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
	onLocationSelect?: (lat: number, lng: number) => void;
}

function Map({ onLocationSelect }: MapProps) {
	const mapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<L.Map | null>(null);
	const [selectedLocation, setSelectedLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const markerRef = useRef<L.Marker | null>(null);

	useEffect(() => {
		if (!mapContainer.current || map.current) return;

		// Initialize map centered on Norway (since this is a Norwegian bird observation app)
		map.current = L.map(mapContainer.current).setView([60.472, 8.4689], 6);

		// Add OpenStreetMap tiles with topographic styling
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			maxZoom: 19,
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(map.current);

		// Add click handler to select location
		map.current.on("click", (e: L.LeafletMouseEvent) => {
			const { lat, lng } = e.latlng;
			setSelectedLocation({ lat, lng });

			// Remove existing marker if any
			if (markerRef.current) {
				markerRef.current.remove();
			}

			// Add new marker at clicked location
			if (map.current) {
				markerRef.current = L.marker([lat, lng]).addTo(map.current);
				markerRef.current.bindPopup(
					`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
				).openPopup();
			}

			// Call callback if provided
			if (onLocationSelect) {
				onLocationSelect(lat, lng);
			}
		});

		// Cleanup
		return () => {
			if (map.current) {
				map.current.remove();
				map.current = null;
			}
		};
	}, [onLocationSelect]);

	return (
		<div className="map-wrapper">
			<div className="map-info">
				<h2>Select Your Location</h2>
				<p>
					Click on the map to select where you are making a bird observation
				</p>
				{selectedLocation && (
					<div className="location-display">
						<strong>Selected Location:</strong>
						<br />
						Latitude: {selectedLocation.lat.toFixed(6)}
						<br />
						Longitude: {selectedLocation.lng.toFixed(6)}
					</div>
				)}
			</div>
			<div ref={mapContainer} className="map-container" />
		</div>
	);
}

export default Map;
