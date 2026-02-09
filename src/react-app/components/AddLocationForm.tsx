import { useState } from 'react';
import { Button } from './ui/button';
import { useLocations } from '../context/LocationsContext';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';
import { CreateUserLocation } from '../api/locations';

interface AddLocationFormProps {
  initialLocation: { lat: number; lng: number };
  onClose: () => void;
}

export function AddLocationForm({ initialLocation, onClose }: AddLocationFormProps) {
  const { addLocation } = useLocations();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    lat: initialLocation.lat.toString(),
    lng: initialLocation.lng.toString(),
    uncertaintyRadius: '10',
    description: '',
  });

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
