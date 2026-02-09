import { useState } from 'react';
import { Button } from './ui/button';
import { useLocations } from '../context/LocationsContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, Edit2, MapPin, Plus, LogOut, History, Download } from 'lucide-react';
import { CreateUserLocation } from '../api/locations';
import { UserLocation } from '../types/location';
import { ThemeToggle } from './ThemeToggle';
import { useDownloadExport, useExportLogs } from '../queries/useExports';
import { isSupabaseConfigured } from '../lib/supabase';

interface UserProfileProps {
  onBack: () => void;
}

export function UserProfile({ onBack }: UserProfileProps) {
  const { locations, addLocation, updateLocation, deleteLocation } = useLocations();
  const { user, signOut } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<UserLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    lat: '',
    lng: '',
    uncertaintyRadius: '10',
    description: '',
  });
  
  const supabaseConfigured = isSupabaseConfigured();
  const { data: exportLogs = [], isLoading: isLoadingLogs } = useExportLogs();
  const { mutate: downloadExport, isPending: isDownloading } = useDownloadExport();

  const handleSignOut = async () => {
    await signOut();
    onBack();
  };

  const handleDownloadPrevious = (filePath: string, fileName: string) => {
    downloadExport(
      { filePath, fileName },
      {
        onSuccess: () => {
          alert('Tidligere eksport lastet ned!');
        },
        onError: (error) => {
          alert(`Feil ved nedlasting: ${error.message}`);
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);
    const uncertaintyRadius = parseInt(formData.uncertaintyRadius);

    if (isNaN(lat) || isNaN(lng) || isNaN(uncertaintyRadius)) {
      alert('Vennligst fyll inn gyldige verdier for koordinater og usikkerhet');
      return;
    }

    if (editingLocation) {
      // Update existing location
      updateLocation({
        ...editingLocation,
        name: formData.name,
        location: { lat, lng },
        uncertaintyRadius,
        description: formData.description,
      });
    } else {
      // Add new location
      const newLocation: CreateUserLocation = {
        userId: user?.id || null,
        name: formData.name,
        location: { lat, lng },
        uncertaintyRadius,
        description: formData.description,
      };
      addLocation(newLocation);
    }

    // Reset form
    setFormData({ name: '', lat: '', lng: '', uncertaintyRadius: '10', description: '' });
    setShowForm(false);
    setEditingLocation(null);
  };

  const handleEdit = (location: UserLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      lat: location.location.lat.toString(),
      lng: location.location.lng.toString(),
      uncertaintyRadius: location.uncertaintyRadius.toString(),
      description: location.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Er du sikker på at du vil slette denne plasseringen?')) {
      deleteLocation(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingLocation(null);
    setFormData({ name: '', lat: '', lng: '', uncertaintyRadius: '10', description: '' });
  };

  return (
    <div className="w-full min-h-screen bg-sand dark:bg-bark pb-16 md:pb-0">
      <header className="bg-forest text-sand p-lg md:p-xl relative">
        <div className="max-w-4xl mx-auto ml-16">
          <h1 className="text-sand m-0 text-[clamp(2rem,6vw,3rem)] tracking-wider">profil</h1>
        </div>
        <div className="absolute left-lg top-1/2 -translate-y-1/2">
          <ThemeToggle/>
        </div>
        <div className="absolute right-lg top-1/2 -translate-y-1/2 flex items-center gap-2">
          {supabaseConfigured && user && (
            <Button
              onClick={handleSignOut}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <LogOut size={16}/>
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
          <h2 className="text-2xl font-bold text-bark dark:text-sand mb-lg">Mine plasseringer</h2>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="mb-4 flex items-center gap-2"
            >
              <Plus size={20} />
              Legg til ny plassering
            </Button>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-moss/5 dark:bg-moss/10 rounded-lg border-2 border-moss">
              <h3 className="text-lg font-semibold mb-4 text-bark dark:text-sand">
                {editingLocation ? 'Rediger plassering' : 'Ny plassering'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-bark dark:text-sand">
                    Navn *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 rounded border-2 border-moss bg-sand dark:bg-bark text-bark dark:text-sand"
                    placeholder="f.eks. Hjemme, Jobb, Favorittpark"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-bark dark:text-sand">
                      Breddegrad *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                      className="w-full p-2 rounded border-2 border-moss bg-sand dark:bg-bark text-bark dark:text-sand"
                      placeholder="59.9139"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-bark dark:text-sand">
                      Lengdegrad *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                      className="w-full p-2 rounded border-2 border-moss bg-sand dark:bg-bark text-bark dark:text-sand"
                      placeholder="10.7522"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-bark dark:text-sand">
                    Usikkerhet (meter) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.uncertaintyRadius}
                    onChange={(e) => setFormData({ ...formData, uncertaintyRadius: e.target.value })}
                    className="w-full p-2 rounded border-2 border-moss bg-sand dark:bg-bark text-bark dark:text-sand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-bark dark:text-sand">
                    Beskrivelse
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 rounded border-2 border-moss bg-sand dark:bg-bark text-bark dark:text-sand"
                    rows={3}
                    placeholder="Tilleggsinformasjon om plasseringen"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button type="submit" variant="default">
                  {editingLocation ? 'Lagre endringer' : 'Legg til'}
                </Button>
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Avbryt
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {locations.length === 0 ? (
              <div className="text-center py-8 text-bark/60 dark:text-sand/60">
                <MapPin size={48} className="mx-auto mb-2 opacity-50" />
                <p>Ingen plasseringer lagt til ennå</p>
                <p className="text-sm mt-1">Klikk på "Legg til ny plassering" for å komme i gang</p>
              </div>
            ) : (
              locations.map((location) => (
                <div
                  key={location.id}
                  className="p-4 bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30 hover:border-moss transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-bark dark:text-sand mb-1">
                        {location.name}
                      </h3>
                      <p className="text-sm text-bark/70 dark:text-sand/70">
                        {location.location.lat.toFixed(4)}, {location.location.lng.toFixed(4)}
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
                      <button
                        onClick={() => handleEdit(location)}
                        className="p-2 hover:bg-moss/10 rounded-lg transition-colors"
                        aria-label="Rediger"
                      >
                        <Edit2 size={18} className="text-bark dark:text-sand" />
                      </button>
                      <button
                        onClick={() => handleDelete(location.id)}
                        className="p-2 hover:bg-rust/10 rounded-lg transition-colors"
                        aria-label="Slett"
                      >
                        <Trash2 size={18} className="text-rust" />
                      </button>
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
              <History size={24}/>
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
                          {new Date(log.createdAt).toLocaleString('no-NO')}
                        </p>
                        <p className="text-xs text-bark/60 dark:text-sand/60 mt-1">
                          {log.observationIds.length} observasjoner
                        </p>
                      </div>
                      {log.filePath && (
                        <Button
                          onClick={() => handleDownloadPrevious(log.filePath!, log.fileName)}
                          disabled={isDownloading}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Download size={16}/>
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
    </div>
  );
}
