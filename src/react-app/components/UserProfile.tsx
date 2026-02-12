import { useState } from "react";
import { Button } from "./ui/button";
import { useLocations } from "../context/LocationsContext";
import { useAuth } from "../context/AuthContext";
import {
  Download,
  Edit2,
  History,
  LogOut,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import { UserLocation } from "../types/location";
import { ThemeToggle } from "./ThemeToggle";
import { useDownloadExport, useExportLogs } from "../queries/useExports";
import { isSupabaseConfigured } from "../lib/supabase";
import { LocationForm } from "./LocationForm.tsx";

interface UserProfileProps {
  onBack: () => void;
}

export function UserProfile({ onBack }: UserProfileProps) {
  const { locations, deleteLocation } = useLocations();
  const { user, signOut } = useAuth();
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<UserLocation | null>(
    null,
  );
  const [formLocation, setFormLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const supabaseConfigured = isSupabaseConfigured();
  const { data: exportLogs = [], isLoading: isLoadingLogs } = useExportLogs();
  const { mutate: downloadExport, isPending: isDownloading } =
    useDownloadExport();

  const handleSignOut = async () => {
    await signOut();
    onBack();
  };

  const handleDownloadPrevious = (filePath: string, fileName: string) => {
    downloadExport(
      { filePath, fileName },
      {
        onSuccess: () => {
          alert("Tidligere eksport lastet ned!");
        },
        onError: (error) => {
          alert(`Feil ved nedlasting: ${error.message}`);
        },
      },
    );
  };

  const handleAddNew = () => {
    // Use Oslo coordinates as default for new locations
    setFormLocation({ lat: 59.9139, lng: 10.7522 });
    setEditingLocation(null);
    setShowLocationForm(true);
  };

  const handleEdit = (location: UserLocation) => {
    setFormLocation(location.location);
    setEditingLocation(location);
    setShowLocationForm(true);
  };

  const handleDelete = (id: string) => {
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
      <header className="bg-forest text-sand p-lg md:p-xl relative">
        <div className="max-w-4xl mx-auto ml-16">
          <h1 className="text-sand m-0 text-[clamp(2rem,6vw,3rem)] tracking-wider">
            profil
          </h1>
        </div>
        <div className="absolute left-lg top-1/2 -translate-y-1/2">
          <ThemeToggle />
        </div>
        <div className="absolute right-lg top-1/2 -translate-y-1/2 flex items-center gap-2">
          {supabaseConfigured && user && (
            <Button
              onClick={handleSignOut}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <LogOut size={16} />
              <span className="hidden md:inline">Logg ut</span>
            </Button>
          )}
        </div>
      </header>

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
          <Button
            onClick={handleAddNew}
            className="mb-4 flex items-center gap-2"
          >
            <Plus size={20} />
            Legg til ny lokalitet
          </Button>

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
                  className="p-4 bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30 hover:border-moss transition-colors cursor-pointer"
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
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => handleEdit(location)}
                        variant={"ghost"}
                        className={"px-2"}
                        aria-label="Rediger"
                      >
                        <Edit2 size={18} className="text-bark dark:text-sand" />
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Export History Section */}
        {supabaseConfigured && exportLogs.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-bark dark:text-sand mb-lg flex items-center gap-2">
              <History size={24} />
              Eksporthistorikk
            </h2>
            <div className="space-y-3">
              {isLoadingLogs ? (
                <div className="text-center py-8 text-bark/60 dark:text-sand/60">
                  <p>Laster...</p>
                </div>
              ) : (
                exportLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-bark dark:text-sand">
                          {log.fileName}
                        </h3>
                        <p className="text-sm text-bark/70 dark:text-sand/70 mt-1">
                          {new Date(log.createdAt).toLocaleString("no-NO")}
                        </p>
                        <p className="text-xs text-bark/60 dark:text-sand/60 mt-1">
                          {log.observationIds.length} observasjoner
                        </p>
                      </div>
                      {log.filePath && (
                        <Button
                          onClick={() =>
                            handleDownloadPrevious(log.filePath!, log.fileName)
                          }
                          disabled={isDownloading}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Download size={16} />
                          Last ned
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {formLocation && (
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
