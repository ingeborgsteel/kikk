// src/App.tsx

import {useState} from "react";
import Map from "./Map";
import MyObservations from "./components/MyObservations";
import {Button} from "./components/ui/button";
import {useObservations} from "./context/ObservationsContext";
import ObservationForm from "./components/ObservationForm.tsx";
import {ThemeToggle} from "./components/ThemeToggle";
import {AuthButton} from "./components/AuthButton";
import {LoginForm} from "./components/LoginForm.tsx";
import {BottomNav} from "./components/BottomNav";

function App() {
  const [currentView, setCurrentView] = useState<'map' | 'observations'>('map');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedZoom, setSelectedZoom] = useState<number>(13); // Default zoom level
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingObservationId, setEditingObservationId] = useState<string | null>(null);
  const {observations} = useObservations();

  const handleLocationSelect = (lat: number, lng: number, zoom: number) => {
    setSelectedLocation({lat, lng});
    setSelectedZoom(zoom);
    setEditingObservationId(null);
    setShowAddForm(true);
  };

  const handleObservationClick = (observationId: string) => {
    setEditingObservationId(observationId);
    setSelectedLocation(null);
    setShowAddForm(true);
  };

  const onClose = () => {
    setShowAddForm(false);
    setSelectedLocation(null);
    setEditingObservationId(null);
  };

  const editingObservation = editingObservationId 
    ? observations.find(obs => obs.id === editingObservationId)
    : undefined;

  if (currentView === 'observations') {
    return (
      <>
        <MyObservations 
          onBack={() => setCurrentView('map')}
          setShowLoginForm={setShowLoginForm}
        />
        <BottomNav currentView={currentView} onViewChange={setCurrentView} />
        <LoginForm closeLoginForm={() => setShowLoginForm(false)} showLoginForm={showLoginForm}/>
      </>
    );
  }

  return (
    <div className="w-full min-h-screen p-0 flex flex-col bg-sand dark:bg-bark pb-16 md:pb-0">
      <header className="text-center p-lg md:p-xl bg-forest relative overflow-visible">
        <h1 className="text-sand m-0 text-[clamp(2rem,6vw,3rem)] tracking-wider">kikk</h1>
        <div className="absolute left-lg top-1/2 -translate-y-1/2">
          <ThemeToggle/>
        </div>
        <div className="absolute right-lg top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
          <AuthButton setShowLoginForm={setShowLoginForm}/>
          <Button
            onClick={() => setCurrentView('observations')}
            variant="secondary"
          >
            Mine Observasjoner ({observations.length})
          </Button>
        </div>
      </header>
      <Map 
        onLocationSelect={handleLocationSelect} 
        observations={observations}
        onObservationClick={handleObservationClick}
      />

      {showAddForm && (editingObservation?.location || selectedLocation) && (
        <ObservationForm
          location={editingObservation?.location || selectedLocation!}
          zoom={selectedZoom}
          observation={editingObservation}
          onClose={onClose}
        />
      )}
      <LoginForm closeLoginForm={() => setShowLoginForm(false)} showLoginForm={showLoginForm}/>
      <BottomNav currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
}

export default App;
