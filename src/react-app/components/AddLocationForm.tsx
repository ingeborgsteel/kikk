import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './ui/button';
import { useLocations } from '../context/LocationsContext';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';
import { CreateUserLocation } from '../api/locations';
import { UserLocation } from '../types/location';
import { reverseGeocode } from '../lib/utils';
import { LocationEditor } from './LocationEditor';

interface AddLocationFormProps {
  initialLocation: { lat: number; lng: number };
  onClose: () => void;
  editingLocation?: UserLocation | null;
}

interface LocationFormData {
  name: string;
  lat: string;
  lng: string;
  uncertaintyRadius: string;
  description: string;
}

export function AddLocationForm({ initialLocation, onClose, editingLocation }: AddLocationFormProps) {
  const { addLocation, updateLocation } = useLocations();
  const { user } = useAuth();
  const [loadingName, setLoadingName] = useState(!editingLocation);
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  
  const { register, handleSubmit, setValue } = useForm<LocationFormData>({
    defaultValues: {
      name: editingLocation?.name || '',
      lat: initialLocation.lat.toString(),
      lng: initialLocation.lng.toString(),
      uncertaintyRadius: editingLocation?.uncertaintyRadius.toString() || '10',
      description: editingLocation?.description || '',
    },
  });

  // Fetch suggested name from reverse geocoding (only for new locations)
  useEffect(() => {
    if (editingLocation) return; // Skip for editing
    
    setLoadingName(true);
    reverseGeocode(initialLocation.lat, initialLocation.lng)
      .then(name => {
        if (name) {
          setValue('name', name);
        }
      })
      .catch(err => {
        console.error('Failed to get location name suggestion:', err);
      })
      .finally(() => {
        setLoadingName(false);
      });
  }, [initialLocation, editingLocation, setValue]);

  // Update coordinates when location changes in map
  const handleLocationChange = (lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
    setValue('lat', lat.toString());
    setValue('lng', lng.toString());
  };

  const onSubmit = (data: LocationFormData) => {
    const lat = parseFloat(data.lat);
    const lng = parseFloat(data.lng);
    const uncertaintyRadius = parseInt(data.uncertaintyRadius);

    if (isNaN(lat) || isNaN(lng) || isNaN(uncertaintyRadius)) {
      alert('Vennligst fyll inn gyldige verdier for koordinater og usikkerhet');
      return;
    }

    if (editingLocation) {
      // Update existing location
      updateLocation({
        ...editingLocation,
        name: data.name,
        location: { lat, lng },
        uncertaintyRadius,
        description: data.description,
      });
    } else {
      // Add new location
      const newLocation: CreateUserLocation = {
        userId: user?.id || null,
        name: data.name,
        location: { lat, lng },
        uncertaintyRadius,
        description: data.description,
      };
      addLocation(newLocation);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 md:p-8">
      <div className="w-full max-w-lg bg-sand dark:bg-bark rounded-lg shadow-custom-2xl my-8">
        <div className="p-6 border-b-2 border-moss dark:border-moss flex justify-between items-center">
          <h2 className="text-2xl font-bold text-bark dark:text-sand">
            {editingLocation ? 'Rediger plassering' : 'Ny plassering'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-moss/10 rounded-lg transition-colors"
            aria-label="Lukk"
          >
            <X size={24} className="text-bark dark:text-sand" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-4">
            {/* Map Preview */}
            <div>
              <label className="block text-sm font-medium mb-1 text-bark dark:text-sand">
                Plassering
              </label>
              <p className="text-xs text-bark/60 dark:text-sand/60 mb-2">
                Lat: {currentLocation.lat.toFixed(4)}, Lng: {currentLocation.lng.toFixed(4)}
              </p>
              <LocationEditor
                location={currentLocation}
                onLocationChange={handleLocationChange}
                zoom={15}
              />
              <p className="text-xs text-bark/60 dark:text-sand/60 mt-1">
                Dra markøren eller klikk for å justere posisjon
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-bark dark:text-sand">
                Navn *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  {...register('name')}
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
                  {...register('lat')}
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
                  {...register('lng')}
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
                {...register('uncertaintyRadius')}
                className="w-full p-2 rounded border-2 border-moss bg-sand dark:bg-bark text-bark dark:text-sand"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-bark dark:text-sand">
                Beskrivelse
              </label>
              <textarea
                {...register('description')}
                className="w-full p-2 rounded border-2 border-moss bg-sand dark:bg-bark text-bark dark:text-sand"
                rows={3}
                placeholder="Tilleggsinformasjon om plasseringen"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button type="submit" variant="default" className="flex-1">
              {editingLocation ? 'Lagre endringer' : 'Lagre plassering'}
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
