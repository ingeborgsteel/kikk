import { MapPin, Binoculars } from 'lucide-react';
import { Button } from './ui/button';
import { LocationEditor } from './LocationEditor';
import { useState } from 'react';

interface MapClickDialogProps {
  location: { lat: number; lng: number };
  onAddObservation: (location: { lat: number; lng: number }) => void;
  onAddLocation: (location: { lat: number; lng: number }) => void;
  onClose: () => void;
}

export function MapClickDialog({ location: initialLocation, onAddObservation, onAddLocation, onClose }: MapClickDialogProps) {
  const [location, setLocation] = useState(initialLocation);

  const handleLocationChange = (lat: number, lng: number) => {
    setLocation({ lat, lng });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-sand dark:bg-bark rounded-lg shadow-custom-2xl">
        <div className="p-6">
          <h2 className="text-xl font-bold text-bark dark:text-sand mb-2">
            Hva vil du gjøre?
          </h2>
          <p className="text-sm text-bark/70 dark:text-sand/70 mb-4">
            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </p>
          
          {/* Map Editor */}
          <div className="mb-4 border-2 border-moss rounded-lg overflow-hidden">
            <LocationEditor
              location={location}
              onLocationChange={handleLocationChange}
              zoom={15}
            />
          </div>
          <p className="text-xs text-bark/60 dark:text-sand/60 mb-6 text-center">
            Dra markøren eller klikk for å justere posisjon
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => onAddObservation(location)}
              className="w-full flex items-center justify-center gap-2 h-auto py-4"
              variant="default"
            >
              <Binoculars size={24} />
              <div className="text-left">
                <div className="font-semibold">Legg til observasjon</div>
                <div className="text-xs opacity-90">Registrer arter du har sett</div>
              </div>
            </Button>
            
            <Button
              onClick={() => onAddLocation(location)}
              className="w-full flex items-center justify-center gap-2 h-auto py-4"
              variant="secondary"
            >
              <MapPin size={24} />
              <div className="text-left">
                <div className="font-semibold">Lagre som min plassering</div>
                <div className="text-xs opacity-90">Opprett en forhåndsinnstilt plassering</div>
              </div>
            </Button>
          </div>
          
          <Button
            onClick={onClose}
            className="w-full mt-4"
            variant="outline"
          >
            Avbryt
          </Button>
        </div>
      </div>
    </div>
  );
}
