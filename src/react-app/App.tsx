// src/App.tsx

import {useState} from "react";
import Map from "./Map";
import MyObservations from "./components/MyObservations";
import {Button} from "./components/ui/button";
import {useObservations} from "./context/ObservationsContext";
import {useLocations} from "./context/LocationsContext";
import ObservationForm from "./components/ObservationForm.tsx";
import {ThemeToggle} from "./components/ThemeToggle";
import {LoginForm} from "./components/LoginForm.tsx";
import {BottomNav} from "./components/BottomNav";
import {UserProfile} from "./components/UserProfile.tsx";
import {MapClickDialog} from "./components/MapClickDialog.tsx";
import {AddLocationForm} from "./components/AddLocationForm.tsx";

function App() {
  const [currentView, setCurrentView] = useState<'map' | 'observations' | 'profile'>('map');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedZoom, setSelectedZoom] = useState<number>(13); // Default zoom level
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showMapClickDialog, setShowMapClickDialog] = useState(false);
  const [showAddLocationForm, setShowAddLocationForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingObservationId, setEditingObservationId] = useState<string | null>(null);
  const {observations} = useObservations();
  const {locations} = useLocations();

  const handleLocationSelect = (lat: number, lng: number, zoom: number) => {
    setSelectedLocation({lat, lng});
    setSelectedZoom(zoom);
    setEditingObservationId(null);
    // Show dialog to choose between observation or location
    setShowMapClickDialog(true);
  };

  const handleAddObservation = () => {
    setShowMapClickDialog(false);
    setShowAddForm(true);
  };

  const handleAddLocation = () => {
    setShowMapClickDialog(false);
    setShowAddLocationForm(true);
  };

  const handleCloseMapClickDialog = () => {
    setShowMapClickDialog(false);
    setSelectedLocation(null);
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
    setShowAddLocationForm(false);
    setSelectedLocation(null);
    setEditingObservationId(null);
  };

  const editingObservation = editingObservationId
    ? observations.find(obs => obs.id === editingObservationId)
    : undefined;

  if (currentView === 'profile') {
    return (
      <>
        <UserProfile
          onBack={() => setCurrentView('map')}
        />
        <BottomNav 
          currentView={currentView} 
          onViewChange={setCurrentView}
          onLoginClick={() => setShowLoginForm(true)}
        />
        <LoginForm closeLoginForm={() => setShowLoginForm(false)} showLoginForm={showLoginForm}/>
      </>
    );
  }

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
          onLoginClick={() => setShowLoginForm(true)}
        />
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
          <Button
            onClick={() => setCurrentView('observations')}
            variant="secondary"
          >
            Kikket på ({observations.length})
          </Button>
          <Button
            onClick={() => setCurrentView('profile')}
            variant="secondary"
          >
            Profil
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
      {showMapClickDialog && selectedLocation && (
        <MapClickDialog
          location={selectedLocation}
          onAddObservation={handleAddObservation}
          onAddLocation={handleAddLocation}
          onClose={handleCloseMapClickDialog}
        />
      )}
      {showAddLocationForm && selectedLocation && (
        <AddLocationForm
          initialLocation={selectedLocation}
          onClose={onClose}
        />
      )}
      <LoginForm closeLoginForm={() => setShowLoginForm(false)} showLoginForm={showLoginForm}/>
      <BottomNav 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onLoginClick={() => setShowLoginForm(true)}
      />
    </div>
  );
}

export default App;
