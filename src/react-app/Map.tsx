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

		// Add click handler to select location
		const mapInstance = map.current;
		mapInstance.on("click", (e: L.LeafletMouseEvent) => {
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

		// Try to get user's current location
		if ("geolocation" in navigator) {
			setIsLocating(true);
			setLocationError(null);
			// eslint-disable-next-line react-hooks/exhaustive-deps
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					setUserLocation({ lat: latitude, lng: longitude });
					if (mapInstance) {
						mapInstance.setView([latitude, longitude], 13);
					}
					setIsLocating(false);
					setLocationError(null);
				},
				(error) => {
					let errorMessage = "Unable to get your location";
					switch (error.code) {
						case error.PERMISSION_DENIED:
							errorMessage = "Location permission denied. Please enable location access in your browser settings.";
							break;
						case error.POSITION_UNAVAILABLE:
							errorMessage = "Location information is unavailable.";
							break;
						case error.TIMEOUT:
							errorMessage = "Location request timed out. Please try again.";
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
			setLocationError("Geolocation is not supported by your browser.");
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
			{locationError && (
				<div className="location-error">
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<circle cx="12" cy="12" r="10" />
						<line x1="12" y1="8" x2="12" y2="12" />
						<line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
					<span>{locationError}</span>
				</div>
			)}
			{userLocation && !selectedLocation && (
				<div className="location-success">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path d="M20 6L9 17l-5-5" />
					</svg>
					<span>Centered on your location</span>
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
