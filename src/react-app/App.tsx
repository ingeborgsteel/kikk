// src/App.tsx

import { useState } from "react";
import Map from "./Map";
import MyObservations from "./components/MyObservations";
import AddObservationForm from "./components/AddObservationForm";
import { Button } from "./components/ui/button";
import { useObservations } from "./context/ObservationsContext";
import { Observation } from "./types/observation";

function App() {
	const [currentView, setCurrentView] = useState<'map' | 'observations'>('map');
	const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
	const [showAddForm, setShowAddForm] = useState(false);
	const { addObservation, observations } = useObservations();

	const handleLocationSelect = (lat: number, lng: number) => {
		setSelectedLocation({ lat, lng });
		setShowAddForm(true);
	};

	const handleSaveObservation = (observationData: {
		location: { lat: number; lng: number };
		uncertaintyRadius: number;
		speciesObservations: Observation['speciesObservations'];
		date: string;
		comment: string;
	}) => {
		const now = new Date().toISOString();
		const observation: Observation = {
			id: `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			...observationData,
			createdAt: now,
			updatedAt: now,
		};
		
		addObservation(observation);
		setShowAddForm(false);
		setSelectedLocation(null);
	};

	const handleCancelAdd = () => {
		setShowAddForm(false);
		setSelectedLocation(null);
	};

	if (currentView === 'observations') {
		return <MyObservations onBack={() => setCurrentView('map')} />;
	}

	return (
		<div className="w-full min-h-screen p-0 flex flex-col bg-sand">
			<header className="text-center p-lg md:p-xl bg-forest relative">
				<h1 className="text-sand m-0 text-[clamp(2rem,6vw,3rem)] tracking-wider">kikk</h1>
				<div className="absolute right-lg top-1/2 -translate-y-1/2">
					<Button 
						onClick={() => setCurrentView('observations')}
						variant="secondary"
					>
						My Observations ({observations.length})
					</Button>
				</div>
			</header>
			<Map onLocationSelect={handleLocationSelect} />
			
			{showAddForm && selectedLocation && (
				<AddObservationForm
					location={selectedLocation}
					onSave={handleSaveObservation}
					onCancel={handleCancelAdd}
				/>
			)}
		</div>
	);
}

export default App;
