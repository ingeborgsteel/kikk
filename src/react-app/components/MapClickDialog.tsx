import { Binoculars, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Modal } from "./ui/Modal";
import { LocationEditor } from "./LocationEditor";
import { useState } from "react";

interface MapClickDialogProps {
  location: { lat: number; lng: number };
  onAddObservation: (location: { lat: number; lng: number }) => void;
  onAddLocation: (location: { lat: number; lng: number }) => void;
  onClose: () => void;
  isOpen: boolean;
  zoom?: number;
}

export function MapClickDialog({
  location: initialLocation,
  onAddObservation,
  onAddLocation,
  onClose,
  isOpen,
  zoom,
}: MapClickDialogProps) {
  const [location, setLocation] = useState(initialLocation);

  const handleLocationChange = (lat: number, lng: number) => {
    setLocation({ lat, lng });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hva vil du gjøre?"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-3">
        <LocationEditor
          location={location}
          onLocationChange={handleLocationChange}
          zoom={zoom}
        />

        <Button
          onClick={() => onAddObservation(location)}
          className="w-full flex items-center justify-center gap-2 h-auto py-4"
          variant="default"
        >
          <Binoculars size={24} />
          <div className="text-left">
            <div className="font-semibold">Legg til observasjon</div>
            <div className="text-xs opacity-90">
              Registrer arter du har sett
            </div>
          </div>
        </Button>

        <Button
          onClick={() => onAddLocation(location)}
          className="w-full flex items-center justify-center gap-2 h-auto py-4"
          variant="secondary"
        >
          <MapPin size={24} />
          <div className="text-left">
            <div className="font-semibold">Lagre som min lokalitet</div>
            <div className="text-xs opacity-90">
              Opprett en forhåndsinnstilt lokalitet
            </div>
          </div>
        </Button>
      </div>

      <Button onClick={onClose} className="w-full mt-4" variant="outline">
        Avbryt
      </Button>
    </Modal>
  );
}
