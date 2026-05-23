import {
  Binoculars,
  Calendar,
  ChevronRight,
  MapPinned,
  Pencil,
  Plus,
} from "lucide-react";
import { useMemo } from "react";
import { useObservations } from "../context/ObservationsContext";
import { UserLocation } from "../types/location";
import { Observation } from "../types/observation";
import { Button } from "./ui/button";
import { Modal } from "./ui/Modal";

interface LocationObservationsDialogProps {
  location: UserLocation;
  isOpen: boolean;
  onClose: () => void;
  onAddObservation: () => void;
  onObservationClick: (observationId: string) => void;
  onEditLocation: () => void;
}

function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return "Ukjent dato";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const isMidnight = date.getHours() === 0 && date.getMinutes() === 0;
    return date.toLocaleString("no-NO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...(isMidnight ? {} : { hour: "2-digit", minute: "2-digit" }),
    });
  };

  if (!endDate || startDate === endDate) {
    return formatDate(startDate);
  }

  const startDateTime = new Date(startDate);
  const endDateTime = new Date(endDate);

  if (startDateTime.toDateString() === endDateTime.toDateString()) {
    const endHasTime =
      endDateTime.getHours() !== 0 || endDateTime.getMinutes() !== 0;
    if (endHasTime) {
      return `${formatDate(startDate)} – ${endDateTime.toLocaleString("no-NO", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return formatDate(startDate);
  }

  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

function ObservationRow({
  observation,
  onClick,
}: {
  observation: Observation;
  onClick: () => void;
}) {
  const speciesList = (observation.species || [])
    .map((s) => s.species.PrefferedPopularname || s.species.ValidScientificName)
    .filter(Boolean)
    .join(", ");

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 p-3 rounded-lg border-2 border-moss/40 bg-sand dark:bg-bark hover:border-moss hover:bg-moss/10 dark:hover:bg-moss/20 transition-all group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-xs text-slate mb-0.5">
          <Calendar size={12} />
          <span>
            {formatDateRange(observation.startDate, observation.endDate)}
          </span>
        </div>
        <div className="font-medium text-bark dark:text-sand truncate">
          {speciesList || (
            <span className="text-slate italic">Ingen arter registrert</span>
          )}
        </div>
        {observation.comment && (
          <div className="text-xs text-slate truncate mt-0.5 italic">
            "{observation.comment}"
          </div>
        )}
      </div>
      <ChevronRight
        size={18}
        className="text-slate group-hover:text-moss transition-colors shrink-0"
      />
    </button>
  );
}

export function LocationObservationsDialog({
  location,
  isOpen,
  onClose,
  onAddObservation,
  onObservationClick,
  onEditLocation,
}: LocationObservationsDialogProps) {
  const { observations } = useObservations();

  const locationObservations = useMemo(
    () =>
      observations
        .filter((obs) => obs.locationId === location.id)
        .sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        ),
    [observations, location.id],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={location.name}
      icon={<MapPinned size={22} />}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <Button
          onClick={onAddObservation}
          className="w-full flex items-center justify-center gap-2 h-auto py-4"
          variant="default"
        >
          <Binoculars size={24} />
          <div className="text-left">
            <div className="font-semibold">Ny observasjon</div>
            <div className="text-xs opacity-90">
              Registrer arter du har sett
            </div>
          </div>
          <Plus size={20} className="ml-auto" />
        </Button>

        <button
          type="button"
          onClick={onEditLocation}
          className="w-full flex items-center gap-2 text-sm text-slate hover:text-bark dark:hover:text-sand transition-colors py-1"
        >
          <Pencil size={14} />
          <span>Rediger lokalitet</span>
        </button>

        {locationObservations.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-bark dark:text-sand/70 uppercase tracking-wide">
              Tidligere observasjoner ({locationObservations.length})
            </h3>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {locationObservations.map((obs) => (
                <ObservationRow
                  key={obs.id}
                  observation={obs}
                  onClick={() => {
                    onObservationClick(obs.id);
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate text-center py-4">
            Ingen tidligere observasjoner på denne lokaliteten
          </p>
        )}
      </div>
    </Modal>
  );
}
