// src/App.tsx

import {useState} from "react";
import Map from "./Map";
import MyObservations from "./components/MyObservations";
import {Button} from "./components/ui/button";
import {useObservations} from "./context/ObservationsContext";
import ObservationForm from "./components/ObservationForm.tsx";
import {ThemeToggle} from "./components/ThemeToggle";
import {useAuth} from "./context/AuthContext";

function App() {
  const [currentView, setCurrentView] = useState<'map' | 'observations'>('map');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const {observations} = useObservations();
  const {user, signInWithGoogle, signOut} = useAuth();

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
    <div className="w-full min-h-screen p-0 flex flex-col bg-sand dark:bg-bark">
      <header className="text-center p-lg md:p-xl bg-forest relative">
        <h1 className="text-sand m-0 text-[clamp(2rem,6vw,3rem)] tracking-wider">kikk</h1>
        <div className="absolute left-lg top-1/2 -translate-y-1/2">
          <ThemeToggle />
        </div>
        <div className="absolute right-lg top-1/2 -translate-y-1/2 flex gap-2">
          {user ? (
            <>
              <span className="text-sand text-sm self-center hidden sm:inline">
                {user.email}
              </span>
              <Button
                onClick={() => signOut()}
                variant="secondary"
                size="sm"
              >
                Logg ut
              </Button>
            </>
          ) : (
            <Button
              onClick={() => signInWithGoogle()}
              variant="secondary"
              size="sm"
            >
              Logg inn
            </Button>
          )}
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
