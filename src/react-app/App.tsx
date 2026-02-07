// src/App.tsx

import {useState} from "react";
import Map from "./Map";
import MyObservations from "./components/MyObservations";
import {Button} from "./components/ui/button";
import {useObservations} from "./context/ObservationsContext";
import ObservationForm from "./components/ObservationForm.tsx";

function App() {
  const [currentView, setCurrentView] = useState<'map' | 'observations'>('map');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const {observations} = useObservations();

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({lat, lng});
    setShowAddForm(true);
  };

  const onClose = () => {
    setShowAddForm(false);
    setSelectedLocation(null);
  };

  if (currentView === 'observations') {
    return <MyObservations onBack={() => setCurrentView('map')}/>;
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
            Mine Observasjoner ({observations.length})
          </Button>
        </div>
      </header>
      <Map onLocationSelect={handleLocationSelect}/>

      {showAddForm && selectedLocation && (
        <ObservationForm
          location={selectedLocation}
          onClose={onClose}
        />
      )}
    </div>
  );
}

export default App;
