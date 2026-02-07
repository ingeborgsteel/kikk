// src/App.tsx

import Map from "./Map";
import "./App.css";

function App() {
	const handleLocationSelect = (lat: number, lng: number) => {
		console.log("Location selected:", lat, lng);
	};

	return (
		<div className="app-container">
			<header className="app-header">
				<h1 className="app-title">kikk</h1>
			</header>
			<Map onLocationSelect={handleLocationSelect} />
		</div>
	);
}

export default App;
