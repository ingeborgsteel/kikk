import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useLocations } from '../context/LocationsContext';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';
import { CreateUserLocation } from '../api/locations';
import { reverseGeocode } from '../lib/utils';

interface AddLocationFormProps {
  initialLocation: { lat: number; lng: number };
  onClose: () => void;
}

export function AddLocationForm({ initialLocation, onClose }: AddLocationFormProps) {
  const { addLocation } = useLocations();
  const { user } = useAuth();
  const [loadingName, setLoadingName] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    lat: initialLocation.lat.toString(),
    lng: initialLocation.lng.toString(),
    uncertaintyRadius: '10',
    description: '',
  });

  // Fetch suggested name from reverse geocoding
  useEffect(() => {
    setLoadingName(true);
    reverseGeocode(initialLocation.lat, initialLocation.lng)
      .then(name => {
        if (name) {
          setFormData(prev => ({ ...prev, name }));
        }
      })
      .catch(err => {
        console.error('Failed to get location name suggestion:', err);
      })
      .finally(() => {
        setLoadingName(false);
      });
  }, [initialLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);
    const uncertaintyRadius = parseInt(formData.uncertaintyRadius);

    if (isNaN(lat) || isNaN(lng) || isNaN(uncertaintyRadius)) {
      alert('Vennligst fyll inn gyldige verdier for koordinater og usikkerhet');
      return;
    }

    const newLocation: CreateUserLocation = {
      userId: user?.id || null,
      name: formData.name,
      location: { lat, lng },
      uncertaintyRadius,
      description: formData.description,
    };
    
    addLocation(newLocation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 md:p-8">
      <div className="w-full max-w-lg bg-sand dark:bg-bark rounded-lg shadow-custom-2xl my-8">
        <div className="p-6 border-b-2 border-moss dark:border-moss flex justify-between items-center">
          <h2 className="text-2xl font-bold text-bark dark:text-sand">Ny plassering</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-moss/10 rounded-lg transition-colors"
            aria-label="Lukk"
          >
            <X size={24} className="text-bark dark:text-sand" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-bark dark:text-sand">
                Navn *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 rounded border-2 border-moss bg-sand dark:bg-bark text-bark dark:text-sand"
                  placeholder="f.eks. Hjemme, Jobb, Favorittpark"
                />
                {loadingName && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-slate-border border-t-rust rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-bark/60 dark:text-sand/60 mt-1">
                {loadingName ? 'Henter forslag...' : 'Du kan endre dette navnet'}
              </p>
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

          <div className="flex gap-2 mt-6">
            <Button type="submit" variant="default" className="flex-1">
              Lagre plassering
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Avbryt
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
