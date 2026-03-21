import { Binoculars, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Modal } from "./ui/Modal";
import { LocationEditor } from "./LocationEditor";
import { useState } from "react";
import { isValidPolygon } from "../lib/utils.ts";

interface MapClickDialogProps {
  location: { lat: number; lng: number };
  area?: [number, number][];
  onAddObservation: (location: { lat: number; lng: number }) => void;
  onAddLocation: (location: { lat: number; lng: number }) => void;
  onClose: () => void;
  isOpen: boolean;
  zoom?: number;
}

export function MapClickDialog({
  location: initialLocation,
  area,
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
        {isValidPolygon(area) && (
          <div className="flex items-center gap-2 p-2 bg-forest/10 dark:bg-forest/20 rounded-md text-sm text-bark dark:text-sand">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0 text-forest"
            >
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            </svg>
            <span>Område tegnet med {area.length} hjørnepunkter</span>
          </div>
        )}

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
              {area
                ? "Registrer arter i dette området"
                : "Registrer arter du har sett"}
            </div>
          </div>
        </Button>

        {!area && (
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
        )}
      </div>

      <Button onClick={onClose} className="w-full mt-4" variant="outline">
        Avbryt
      </Button>
    </Modal>
  );
}
