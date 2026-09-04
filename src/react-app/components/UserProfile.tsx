import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { useLocations } from "../context/LocationsContext";
import { useObservations } from "../context/ObservationsContext";
import { useAuth } from "../context/AuthContext";
import { Edit2, MapPin, Plus, Trash2, Binoculars } from "lucide-react";
import { UserLocation } from "../types/location";
import { LocationForm } from "./LocationForm.tsx";
import Header from "./Header.tsx";

interface UserProfileProps {
  onBack: () => void;
}

export function UserProfile({ onBack }: UserProfileProps) {
  const { locations, deleteLocation } = useLocations();
  const { observations } = useObservations();
  const { isImpersonating } = useAuth();
  const readOnly = isImpersonating;

  // Count observations per location
  const locationObservationCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const obs of observations) {
      if (obs.locationId) {
        counts.set(obs.locationId, (counts.get(obs.locationId) || 0) + 1);
      }
    }
    return counts;
  }, [observations]);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<UserLocation | null>(
    null,
  );
  const [formLocation, setFormLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const handleAddNew = () => {
    if (readOnly) return;
    // Use Oslo coordinates as default for new locations
    setFormLocation({ lat: 59.9139, lng: 10.7522 });
    setEditingLocation(null);
    setShowLocationForm(true);
  };

  const handleEdit = (location: UserLocation) => {
    if (readOnly) return;
    setFormLocation(location.location);
    setEditingLocation(location);
    setShowLocationForm(true);
  };

  const handleDelete = (id: string) => {
    if (readOnly) return;
    if (confirm("Er du sikker på at du vil slette denne lokaliteten?")) {
      deleteLocation(id);
    }
  };

  const handleCloseForm = () => {
    setShowLocationForm(false);
    setEditingLocation(null);
    setFormLocation(null);
  };

  return (
    <div className="w-full min-h-screen bg-sand dark:bg-bark pb-16 md:pb-0">
      <Header title={"profil"} />

      <div className="max-w-4xl mx-auto p-lg md:p-xl">
        <div className="mb-lg">
          <div className="hidden md:block">
            <Button onClick={onBack} variant="outline">
              ← Tilbake til kart
            </Button>
          </div>
        </div>

        {/* My Locations Section */}
        <div className="mb-xxl">
          <h2 className="text-2xl font-bold text-bark dark:text-sand mb-lg">
            Mine lokaliteter
          </h2>
          {!readOnly && (
            <Button
              onClick={handleAddNew}
              className="mb-4 flex items-center gap-2"
            >
              <Plus size={20} />
              Legg til ny lokalitet
            </Button>
          )}

          <div className="space-y-3">
            {locations.length === 0 ? (
              <div className="text-center py-8 text-bark/60 dark:text-sand/60">
                <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                <p>Ingen lokalitet lagt til ennå</p>
                <p className="text-sm mt-1">
                  Klikk på "Legg til ny lokalitet" for å komme i gang
                </p>
              </div>
            ) : (
              locations.map((location) => (
                <div
                  key={location.id}
                  onClick={() => handleEdit(location)}
                  className={`p-4 bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30 ${
                    readOnly
                      ? ""
                      : "hover:border-moss transition-colors cursor-pointer"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-bark dark:text-sand mb-1">
                        {location.name}
                      </h3>
                      <p className="text-sm text-bark/70 dark:text-sand/70">
                        {location.location.lat.toFixed(4)},{" "}
                        {location.location.lng.toFixed(4)}
                      </p>
                      <p className="text-xs text-bark/60 dark:text-sand/60 mt-1">
                        ±{location.uncertaintyRadius}m
                      </p>
                      {location.description && (
                        <p className="text-sm text-bark/80 dark:text-sand/80 mt-2">
                          {location.description}
                        </p>
                      )}
                      {location.id && (
                        <p className="text-sm text-bark/70 dark:text-sand/70 mt-2 flex items-center gap-1">
                          <Binoculars size={14} className="text-moss" />
                          {locationObservationCounts.get(location.id) || 0}{" "}
                          {(locationObservationCounts.get(location.id) || 0) ===
                          1
                            ? "observasjon"
                            : "observasjoner"}
                        </p>
                      )}
                    </div>
                    {!readOnly && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleEdit(location)}
                          variant={"ghost"}
                          className={"px-2"}
                          aria-label="Rediger"
                        >
                          <Edit2
                            size={18}
                            className="text-bark dark:text-sand"
                          />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(location.id);
                          }}
                          variant={"ghost"}
                          className={"px-2"}
                          aria-label="Slett"
                        >
                          <Trash2 size={18} className="text-rust" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {formLocation && !readOnly && (
        <LocationForm
          isOpen={showLocationForm}
          initialLocation={formLocation}
          onClose={handleCloseForm}
          editingLocation={editingLocation}
        />
      )}
    </div>
  );
}
