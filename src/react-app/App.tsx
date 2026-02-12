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
import { LocationForm } from "./components/LocationForm.tsx";
import { AuthButton } from "./components/AuthButton.tsx";
import { KikkemodusToggle } from "./components/KikkemodusToggle.tsx";
import { GitHubSuggestionButton } from "./components/GitHubSuggestionButton.tsx";
import { GitHubIssueForm } from "./components/GitHubIssueForm.tsx";
import { UserLocation } from "./types/location.ts";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedZoom, setSelectedZoom] = useState<number>(13); // Default zoom level
  const [showLoginForm, setShowLoginForm] = useState(false);
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
  const { observations } = useObservations();
  const { locations } = useLocations();

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
    // Find the user location
    const userLocation = locations.find((loc) => loc.id === locationId);
    if (userLocation) {
      // Set the location to create a new observation at this preset location
      setSelectedLocation(userLocation.location);
      setPresetLocation(userLocation); // Set preset location name to lock it
      setSelectedZoom(13);
      setEditingObservationId(null);
      setShowAddForm(true);
    }
  };

  const onClose = () => {
    setShowAddForm(false);
    setShowAddLocationForm(false);
    setSelectedLocation(null);
    setPresetLocation(null);
    setEditingObservationId(null);
  };

  const editingObservation = editingObservationId
    ? observations.find((obs) => obs.id === editingObservationId)
    : undefined;

  // Determine current view from location pathname
  const getCurrentView = (): "map" | "observations" | "profile" => {
    if (location.pathname === "/observations") return "observations";
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
          path="/observations"
          element={
            <MyObservations
              onBack={() => navigate("/")}
              setShowLoginForm={setShowLoginForm}
            />
          }
        />
        <Route
          path="/"
          element={
            <div className="w-full min-h-screen p-0 flex flex-col bg-sand dark:bg-bark pb-16 md:pb-0">
              <header className="text-center p-lg md:p-xl bg-forest relative overflow-visible">
                <h1 className="text-sand m-0 text-[clamp(2rem,6vw,3rem)] tracking-wider">
                  kikk
                </h1>
                <div className="absolute left-lg top-1/2 -translate-y-1/2">
                  <KikkemodusToggle
                    kikkemodusActive={kikkemodusActive}
                    onToggle={() => setKikkemodusActive(!kikkemodusActive)}
                  />
                </div>
                <div className="absolute right-lg top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2">
                  <Button
                    onClick={() => navigate("/observations")}
                    variant="secondary"
                  >
                    Kikket på ({observations.length})
                  </Button>
                  <AuthButton
                    setShowLoginForm={setShowLoginForm}
                    openProfilePage={() => navigate("/profile")}
                  />
                </div>
              </header>
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
                  onClose={onClose}
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
      <GitHubSuggestionButton onClick={() => setShowGitHubIssueForm(true)} />
      <BottomNav
        currentView={getCurrentView()}
        onLoginClick={() => setShowLoginForm(true)}
      />
    </>
  );
}

export default App;
