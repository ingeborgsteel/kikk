import { MapPin, Binoculars } from 'lucide-react';
import { Button } from './ui/button';

interface MapClickDialogProps {
  location: { lat: number; lng: number };
  onAddObservation: () => void;
  onAddLocation: () => void;
  onClose: () => void;
}

export function MapClickDialog({ location, onAddObservation, onAddLocation, onClose }: MapClickDialogProps) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-sand dark:bg-bark rounded-lg shadow-custom-2xl">
        <div className="p-6">
          <h2 className="text-xl font-bold text-bark dark:text-sand mb-2">
            Hva vil du gjøre?
          </h2>
          <p className="text-sm text-bark/70 dark:text-sand/70 mb-6">
            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={onAddObservation}
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
              onClick={onAddLocation}
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
