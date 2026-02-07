// src/App.tsx

import Map from "./Map";

function App() {
	const handleLocationSelect = (lat: number, lng: number) => {
		console.log("Location selected:", lat, lng);
	};

	return (
		<div className="w-full min-h-screen p-0 flex flex-col bg-sand">
			<header className="text-center p-lg md:p-xl bg-forest relative">
				<h1 className="text-sand m-0 text-[clamp(2rem,6vw,3rem)] tracking-wider">kikk</h1>
			</header>
			<Map onLocationSelect={handleLocationSelect} />
		</div>
	);
}

export default App;
