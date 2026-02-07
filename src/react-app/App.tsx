// src/App.tsx

import { useState } from "react";
import Map from "./Map";
import "./App.css";

function App() {
	const [location, setLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);

	const handleLocationSelect = (lat: number, lng: number) => {
		setLocation({ lat, lng });
	};

	return (
		<div className="app-container">
			<header className="app-header">
				<h1>Bird Observation App</h1>
				<p>Select your location on the topographic map to register observations</p>
			</header>
			<Map onLocationSelect={handleLocationSelect} />
			{location && (
				<div className="observation-info">
					<p>Ready to record observations at this location!</p>
				</div>
			)}
		</div>
	);
}

export default App;
