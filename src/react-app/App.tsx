// src/App.tsx

import {useState} from "react";
import Map from "./Map";
import MyObservations from "./components/MyObservations";
import {Button} from "./components/ui/button";
import {useObservations} from "./context/ObservationsContext";
import {useLocations} from "./context/LocationsContext";
import ObservationForm from "./components/ObservationForm.tsx";
import {ThemeToggle} from "./components/ThemeToggle";
import {AuthButton} from "./components/AuthButton";
import {LoginForm} from "./components/LoginForm.tsx";
import {BottomNav} from "./components/BottomNav";
import {UserProfile} from "./components/UserProfile.tsx";

function App() {
  const [currentView, setCurrentView] = useState<'map' | 'observations'>('map');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedZoom, setSelectedZoom] = useState<number>(13); // Default zoom level
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingObservationId, setEditingObservationId] = useState<string | null>(null);
  const {observations} = useObservations();
  const {locations} = useLocations();

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

  const handleUserLocationClick = (locationId: string) => {
    // Find the user location
    const userLocation = locations.find(loc => loc.id === locationId);
    if (userLocation) {
      // Set the location to create a new observation at this preset location
      setSelectedLocation(userLocation.location);
      setSelectedZoom(13);
      setEditingObservationId(null);
      setShowAddForm(true);
    }
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
        <BottomNav 
          currentView={currentView} 
          onViewChange={setCurrentView}
          onProfileClick={() => setShowUserProfile(true)}
          onLoginClick={() => setShowLoginForm(true)}
        />
        <LoginForm closeLoginForm={() => setShowLoginForm(false)} showLoginForm={showLoginForm}/>
        {showUserProfile && <UserProfile onClose={() => setShowUserProfile(false)} />}
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
            Kikket på ({observations.length})
          </Button>
        </div>
      </header>
      <Map
        onLocationSelect={handleLocationSelect}
        observations={observations}
        onObservationClick={handleObservationClick}
        userLocations={locations}
        onUserLocationClick={handleUserLocationClick}
      />

      {showAddForm && (editingObservation?.location || selectedLocation) && (
        <ObservationForm
          location={editingObservation?.location || selectedLocation!}
          zoom={editingObservation ? 13 : selectedZoom}
          observation={editingObservation}
          onClose={onClose}
        />
      )}
      <LoginForm closeLoginForm={() => setShowLoginForm(false)} showLoginForm={showLoginForm}/>
      {showUserProfile && <UserProfile onClose={() => setShowUserProfile(false)} />}
      <BottomNav 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onProfileClick={() => setShowUserProfile(true)}
        onLoginClick={() => setShowLoginForm(true)}
      />
    </div>
  );
}

export default App;
