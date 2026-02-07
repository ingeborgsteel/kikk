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
	const [isLocating, setIsLocating] = useState(false);

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

		// Try to get user's current location
		if ("geolocation" in navigator) {
			setIsLocating(true);
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					if (map.current) {
						map.current.setView([latitude, longitude], 13);
					}
					setIsLocating(false);
				},
				(error) => {
					console.log("Geolocation not available:", error);
					setIsLocating(false);
				},
				{
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 0,
				},
			);
		}

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
			if (markerRef.current) {
				markerRef.current = null;
			}
		};
	}, [onLocationSelect]);

	return (
		<div className="map-wrapper">
			{isLocating && (
				<div className="location-loading">
					<div className="loading-spinner"></div>
					<span>Finding your location...</span>
				</div>
			)}
			{selectedLocation && (
				<div className="location-badge">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
						<circle cx="12" cy="10" r="3" />
					</svg>
					<span>
						{selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
					</span>
				</div>
			)}
			<div ref={mapContainer} className="map-container" />
		</div>
	);
}

export default Map;
