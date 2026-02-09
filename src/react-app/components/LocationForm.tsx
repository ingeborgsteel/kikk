import {useEffect, useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {Button} from './ui/button';
import {useLocations} from '../context/LocationsContext';
import {useAuth} from '../context/AuthContext';
import {X} from 'lucide-react';
import {CreateUserLocation} from '../api/locations';
import {UserLocation} from '../types/location';
import {reverseGeocode} from '../lib/utils';
import {LocationEditor} from './LocationEditor';
import {Input} from "./ui/input.tsx";
import {Textarea} from "./ui/textarea.tsx";
import {Label} from "./ui/label.tsx";

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

export function LocationForm({initialLocation, onClose, editingLocation}: AddLocationFormProps) {
  const {addLocation, updateLocation} = useLocations();
  const {user} = useAuth();
  const [loadingName, setLoadingName] = useState(!editingLocation);
  const [currentLocation, setCurrentLocation] = useState(initialLocation);

  const {register, handleSubmit, setValue, control} = useForm<LocationFormData>({
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
    reverseGeocode(currentLocation.lat, currentLocation.lng)
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
  }, [currentLocation, editingLocation, setValue]);

  // Update coordinates when location changes in map
  const handleLocationChange = (lat: number, lng: number) => {
    setCurrentLocation({lat, lng});
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
        location: {lat, lng},
        uncertaintyRadius,
        description: data.description,
      });
    } else {
      // Add new location
      const newLocation: CreateUserLocation = {
        userId: user?.id || null,
        name: data.name,
        location: {lat, lng},
        uncertaintyRadius,
        description: data.description,
      };
      addLocation(newLocation);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
      <div
        className="bg-sand dark:bg-bark w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-custom-2xl border-2 border-moss">
        <div
          className="sticky top-0 bg-forest text-sand p-lg border-b-2 border-moss flex justify-between items-center z-[2000]">
          <h2 className="text-xl font-bold">
            {editingLocation ? 'Rediger plassering' : 'Ny plassering'}
          </h2>
          <Button
            variant={"accent"}
            size={"icon"}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24}/>
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={"p-6"}>
            <div className="space-y-4">
              {/* Map Preview */}
              <div>
                <Label className="text-bark dark:text-sand">
                  Plassering
                </Label>
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
                <Label className="text-bark dark:text-sand">
                  Navn *
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    {...register('name')}
                    className="mt-1"
                    placeholder="f.eks. Hjemme, Jobb, Favorittpark"
                  />
                  {loadingName && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div
                        className="w-4 h-4 border-2 border-slate-border border-t-rust rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-bark/60 dark:text-sand/60 mt-1">
                  {loadingName ? 'Henter forslag...' : ''}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Controller name={"lat"} control={control} render={({field: {onChange, value}}) => (<div>
                  <Label className="text-bark dark:text-sand">
                    Breddegrad *
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    required
                    value={value}
                    onChange={e => {
                      onChange(e);
                      const lat = parseFloat(e.target.value);
                      if (!isNaN(lat)) {
                        handleLocationChange(lat, currentLocation.lng);
                      }
                    }}
                    className="mt-1"
                  />
                </div>)}/>
                <Controller name={"lng"} control={control} render={({field: {onChange, value}}) => (<div>
                  <Label className="text-bark dark:text-sand">
                    Lengdegrad *
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    required
                    value={value}
                    onChange={e => {
                      onChange(e);
                      const lng = parseFloat(e.target.value);
                      if (!isNaN(lng)) {
                        handleLocationChange(currentLocation.lat, lng);
                      }
                    }}
                    className="mt-1"
                  />
                </div>)}/>
              </div>

              <div>
                <Label className="text-bark dark:text-sand">
                  Usikkerhet (meter) *
                </Label>
                <Input
                  type="number"
                  required
                  min="1"
                  {...register('uncertaintyRadius')}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-bark dark:text-sand">
                  Beskrivelse
                </Label>
                <Textarea
                  {...register('description')}
                  className="mt-1"
                  rows={3}
                  placeholder="Tilleggsinformasjon om lokaliteten"
                />
              </div>
            </div>
          </div>

          <div
            className="flex gap-md justify-end pt-md sticky bottom-0 bg-sand dark:bg-bark border-t-2 border-moss p-md z-10">
            <Button type="button" variant="secondary" onClick={onClose}>
              Avbryt
            </Button>
            <Button type="submit" variant="default">
              Lagre
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
