// src/App.tsx

import { useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Map from "./Map";
import MyObservations from "./components/MyObservations";
import { Button } from "./components/ui/button";
import { useObservations } from "./context/ObservationsContext";
import { useLocations } from "./context/LocationsContext";
import ObservationForm from "./components/ObservationForm.tsx";
import { LoginForm } from "./components/LoginForm.tsx";
import { BottomNav } from "./components/BottomNav";
import { UserProfile } from "./components/UserProfile.tsx";
import { MapClickDialog } from "./components/MapClickDialog.tsx";
import { LocationObservationsDialog } from "./components/LocationObservationsDialog.tsx";
import { LocationForm } from "./components/LocationForm.tsx";
import { KikkemodusToggle } from "./components/KikkemodusToggle.tsx";
import { GitHubSuggestionButton } from "./components/GitHubSuggestionButton.tsx";
import { GitHubIssueForm } from "./components/GitHubIssueForm.tsx";
import { StatsDashboard } from "./components/StatsDashboard.tsx";
import { UserLocation } from "./types/location.ts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useMapPreferences } from "./context/MapPreferencesContext.tsx";
import { useGeolocation } from "./context/GeolocationContext.tsx";
import { CircleDashed, Navigation } from "lucide-react";
import Header from "./components/Header.tsx";
import { useAuth } from "./context/AuthContext.tsx";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedZoom, setSelectedZoom] = useState<number>(13); // Default zoom level
  const [showMapClickDialog, setShowMapClickDialog] = useState(false);
  const [showAddLocationForm, setShowAddLocationForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingObservationId, setEditingObservationId] = useState<
    string | null
  >(null);
  const [presetLocation, setPresetLocation] = useState<UserLocation | null>(
    null,
  );
  const [kikkemodusActive, setKikkemodusActive] = useState(false);
  const [showGitHubIssueForm, setShowGitHubIssueForm] = useState(false);
  const [showLocationObservations, setShowLocationObservations] =
    useState(false);
  const [selectedUserLocation, setSelectedUserLocation] =
    useState<UserLocation | null>(null);
  const [editingUserLocation, setEditingUserLocation] =
    useState<UserLocation | null>(null);
  const [returnToObservationAfterSave, setReturnToObservationAfterSave] =
    useState(false);
  const { observations } = useObservations();
  const { locations } = useLocations();
  const { followMode, setFollowMode } = useGeolocation();
  const { showUncertaintyOverlay, setShowUncertaintyOverlay } =
    useMapPreferences();
  const { showLoginForm, setShowLoginForm } = useAuth();

  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.tz.setDefault("Europe/Oslo");

  const handleLocationSelect = (lat: number, lng: number, zoom: number) => {
    setSelectedLocation({ lat, lng });
    setSelectedZoom(zoom);
    setEditingObservationId(null);
    setPresetLocation(null); // Clear preset location name

    // In kikkemodus, go directly to observation form
    if (kikkemodusActive) {
      setShowAddForm(true);
    } else {
      // Show dialog to choose between observation or location
      setShowMapClickDialog(true);
    }
  };

  const handleAddObservation = (location: { lat: number; lng: number }) => {
    setSelectedLocation(location);
    setShowMapClickDialog(false);
    setShowAddForm(true);
  };

  const handleAddLocation = (location: { lat: number; lng: number }) => {
    setSelectedLocation(location);
    setShowMapClickDialog(false);
    setShowAddLocationForm(true);
  };

  const handleCloseMapClickDialog = () => {
    setShowMapClickDialog(false);
    setSelectedLocation(null);
    setPresetLocation(null);
  };

  const handleObservationClick = (observationId: string) => {
    setEditingObservationId(observationId);
    setSelectedLocation(null);
    setPresetLocation(null);
    setShowAddForm(true);
  };

  const handleUserLocationClick = (locationId: string) => {
    const userLocation = locations.find((loc) => loc.id === locationId);
    if (userLocation) {
      setSelectedUserLocation(userLocation);
      setShowLocationObservations(true);
    }
  };

  const handleLocationObservationAdd = () => {
    if (!selectedUserLocation) return;
    setSelectedLocation(selectedUserLocation.location);
    setPresetLocation(selectedUserLocation);
    setSelectedZoom(13);
    setEditingObservationId(null);
    setShowLocationObservations(false);
    setShowAddForm(true);
  };

  const handleLocationObservationClick = (observationId: string) => {
    setShowLocationObservations(false);
    setEditingObservationId(observationId);
    setSelectedLocation(null);
    setPresetLocation(null);
    setShowAddForm(true);
  };

  const handleCloseLocationObservations = () => {
    setShowLocationObservations(false);
    setSelectedUserLocation(null);
  };

  const handleEditLocationFromDialog = () => {
    if (!selectedUserLocation) return;
    setEditingUserLocation(selectedUserLocation);
    setSelectedLocation(selectedUserLocation.location);
    setSelectedZoom(13);
    setShowLocationObservations(false);
    setShowAddLocationForm(true);
  };

  const handleLocationEditFormClose = () => {
    setShowAddLocationForm(false);
    setEditingUserLocation(null);
    setSelectedLocation(null);
    setSelectedUserLocation(null);
  };

  const handleSaveAsLocation = (loc: { lat: number; lng: number }) => {
    setShowAddForm(false);
    setSelectedLocation(loc);
    setReturnToObservationAfterSave(true);
    setShowAddLocationForm(true);
  };

  const handleLocationSaved = (savedLocation: UserLocation) => {
    setShowAddLocationForm(false);
    setPresetLocation(savedLocation);
    setSelectedLocation(savedLocation.location);
    setShowAddForm(true);
    setReturnToObservationAfterSave(false);
  };

  const handleLocationFormClose = () => {
    setShowAddLocationForm(false);

    if (returnToObservationAfterSave) {
      // Return to observation form
      setShowAddForm(true);
      setReturnToObservationAfterSave(false);
    } else {
      // Normal close
      setSelectedLocation(null);
      setPresetLocation(null);
      setEditingObservationId(null);
    }
  };

  const onClose = () => {
    setShowAddForm(false);
    setShowAddLocationForm(false);
    setSelectedLocation(null);
    setPresetLocation(null);
    setEditingObservationId(null);
    setReturnToObservationAfterSave(false);
  };

  const editingObservation = editingObservationId
    ? observations.find((obs) => obs.id === editingObservationId)
    : undefined;

  // Determine current view from location pathname
  const getCurrentView = (): "map" | "observations" | "stats" | "profile" => {
    if (location.pathname === "/observations") return "observations";
    if (location.pathname === "/stats") return "stats";
    if (location.pathname === "/profile") return "profile";
    return "map";
  };

  return (
    <>
      <Routes>
        <Route
          path="/profile"
          element={<UserProfile onBack={() => navigate("/")} />}
        />
        <Route
          path="/stats"
          element={<StatsDashboard onBack={() => navigate("/")} />}
        />
        <Route
          path="/observations"
          element={<MyObservations onBack={() => navigate("/")} />}
        />
        <Route
          path="/"
          element={
            <div className="w-full min-h-screen p-0 flex flex-col bg-sand dark:bg-bark pb-16 md:pb-0">
              <Header
                title={"kikk"}
                openProfilePage={() => navigate("/profile")}
                leftButton={
                  <KikkemodusToggle
                    kikkemodusActive={kikkemodusActive}
                    onToggle={() => setKikkemodusActive(!kikkemodusActive)}
                  />
                }
                navButtons={
                  <>
                    <Button
                      onClick={() => navigate("/observations")}
                      variant="secondary"
                    >
                      Kikket på ({observations.length})
                    </Button>
                    <Button
                      onClick={() => navigate("/stats")}
                      variant="secondary"
                    >
                      Statistikk
                    </Button>
                  </>
                }
              />
              <Map
                onLocationSelect={handleLocationSelect}
                observations={observations}
                onObservationClick={handleObservationClick}
                userLocations={locations}
                onUserLocationClick={handleUserLocationClick}
              />

              {(editingObservation?.location || selectedLocation) && (
                <ObservationForm
                  isOpen={showAddForm}
                  location={editingObservation?.location || selectedLocation!}
                  zoom={selectedZoom}
                  observation={editingObservation}
                  presetLocation={presetLocation}
                  onClose={onClose}
                  onSaveAsLocation={handleSaveAsLocation}
                  onActivateKikkemodus={() => setKikkemodusActive(true)}
                />
              )}
              {showLocationObservations && selectedUserLocation && (
                <LocationObservationsDialog
                  location={selectedUserLocation}
                  isOpen={showLocationObservations}
                  onClose={handleCloseLocationObservations}
                  onAddObservation={handleLocationObservationAdd}
                  onObservationClick={handleLocationObservationClick}
                  onEditLocation={handleEditLocationFromDialog}
                />
              )}
              {showMapClickDialog && selectedLocation && (
                <MapClickDialog
                  zoom={selectedZoom}
                  location={selectedLocation}
                  onAddObservation={handleAddObservation}
                  onAddLocation={handleAddLocation}
                  onClose={handleCloseMapClickDialog}
                  isOpen={showMapClickDialog}
                />
              )}
              {selectedLocation && (
                <LocationForm
                  isOpen={showAddLocationForm}
                  initialLocation={selectedLocation}
                  onClose={
                    editingUserLocation
                      ? handleLocationEditFormClose
                      : handleLocationFormClose
                  }
                  editingLocation={editingUserLocation}
                  onSaved={
                    returnToObservationAfterSave
                      ? handleLocationSaved
                      : undefined
                  }
                  zoom={selectedZoom}
                />
              )}
            </div>
          }
        />
      </Routes>
      <LoginForm
        closeLoginForm={() => setShowLoginForm(false)}
        showLoginForm={showLoginForm}
      />
      <GitHubIssueForm
        onClose={() => setShowGitHubIssueForm(false)}
        showForm={showGitHubIssueForm}
      />
      <div className="fixed bottom-20 md:bottom-14 right-6 z-[500] flex flex-col gap-3 items-end">
        {getCurrentView() === "map" && (
          <>
            <div className="relative group">
              <span className="hidden md:block absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-sand/95 dark:bg-bark/95 px-3 py-1.5 text-sm font-medium text-bark dark:text-sand shadow-custom-lg border border-moss/30 opacity-0 translate-x-1 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
                Følg meg
              </span>
              <Button
                onClick={() => setFollowMode(!followMode)}
                size="icon"
                variant={followMode ? "secondary" : "outline"}
                className="h-10 w-10 box-border shadow-custom-xl hover:shadow-custom-2xl hover:translate-y-0 active:translate-y-0"
                aria-label="Veksle følg meg"
                title="Følg meg"
              >
                <Navigation size={20} />
              </Button>
            </div>
            <div className="relative group">
              <span className="hidden md:block absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-sand/95 dark:bg-bark/95 px-3 py-1.5 text-sm font-medium text-bark dark:text-sand shadow-custom-lg border border-moss/30 opacity-0 translate-x-1 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
                Usikkerhet
              </span>
              <Button
                onClick={() =>
                  setShowUncertaintyOverlay(!showUncertaintyOverlay)
                }
                size="icon"
                variant={showUncertaintyOverlay ? "secondary" : "outline"}
                className="h-10 w-10 box-border shadow-custom-xl hover:shadow-custom-2xl hover:translate-y-0 active:translate-y-0"
                aria-label="Veksle nøyaktighet"
                title="Nøyaktighet"
              >
                <CircleDashed size={20} />
              </Button>
            </div>
          </>
        )}
        <GitHubSuggestionButton
          onClick={() => setShowGitHubIssueForm(true)}
          floating={false}
        />
      </div>
      <BottomNav
        currentView={getCurrentView()}
        onLoginClick={() => setShowLoginForm(true)}
      />
    </>
  );
}

export default App;
