import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Pencil,
  Sparkles,
  Trash2,
  MapPinned,
  User,
  Bird,
} from "lucide-react";
import { Observation } from "../types/observation";
import { Button } from "./ui/button";

interface ObservationItemProps {
  observation: Observation;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (dateString: string) => string;
  formatDateRange: (startDate?: string, endDate?: string) => string;
}

function ObservationItem({
  observation,
  onEdit,
  onDelete,
  formatDate,
}: ObservationItemProps) {
  // Automatically collapse exported observations
  const [isExpanded, setIsExpanded] = useState(!observation.lastExportedAt);

  const isExported = !!observation.lastExportedAt;

  return (
    <div
      className={`bg-white rounded-lg shadow-custom border-2 transition-all ${
        !isExported ? "border-moss border-opacity-60" : "border-slate-border"
      }`}
    >
      {/* New observation badge */}
      {!isExported && (
        <div className="absolute top-2 right-2 bg-moss text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 z-10">
          <Sparkles size={12} />
          Ny
        </div>
      )}

      {/* Header - Always visible */}
      <div
        className={`p-lg ${isExported ? "cursor-pointer hover:bg-sand hover:bg-opacity-30" : ""}`}
        onClick={() => isExported && setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex-1 space-y-1">
            {/* Location name + pills row */}
            <div className="flex items-center gap-sm flex-wrap">
              {observation.locationName && (
                <div className="font-medium text-bark flex items-center gap-1">
                  {observation.locationId && (
                    <MapPinned
                      size={18}
                      className="text-violet-600 dark:text-violet-400"
                    />
                  )}
                  {observation.locationName}
                </div>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-moss/20 text-bark dark:text-sand text-xs rounded-full">
                <Bird size={12} />
                {observation.species.length}{" "}
                {observation.species.length === 1 ? "art" : "arter"}
              </span>
              {observation.observerName && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-moss/20 text-bark dark:text-sand text-xs rounded-full"
                  title={observation.observerName}
                >
                  <User size={12} />
                  {observation.observerName.slice(0, 12)}
                  {observation.observerName.length > 12 ? "..." : ""}
                </span>
              )}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-moss/20 text-bark dark:text-sand text-xs rounded-full"
                title={`±${observation.uncertaintyRadius}m usikkerhet`}
              >
                <MapPin size={12} />±{observation.uncertaintyRadius}m
              </span>
              {isExported && (
                <div
                  className="ml-auto text-slate hover:text-bark transition-colors"
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </div>
              )}
            </div>

            {/* Coordinates with icon */}
            <p className="flex items-center gap-1 font-mono text-xs text-bark/60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                className="text-slate/50"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2v20M2 12h20" />
              </svg>
              {observation.location.lat.toFixed(4)},{" "}
              {observation.location.lng.toFixed(4)}
            </p>

            {/* Date */}
            <p className="text-sm text-bark/70">
              {observation.startDate
                ? new Date(observation.startDate).toLocaleDateString("no-NO", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : ""}
            </p>
            {observation.observerName && (
              <p className="text-sm text-slate flex items-center gap-1 mt-0.5">
                <User size={13} />
                {observation.observerName}
              </p>
            )}
            {observation.hide && (
              <p className="text-sm text-slate flex items-center gap-1 mt-0.5">
                🚫 Skjult fra Artsobservasjoner
              </p>
            )}
            {observation.delayPublication && (
              <p className="text-sm text-slate flex items-center gap-1 mt-0.5">
                📅 Utsett publisering:{" "}
                {formatDate(observation.delayPublication)}
              </p>
            )}
            {isExported && observation.lastExportedAt && (
              <p className="text-xs text-slate mt-1">
                Sist eksportert: {formatDate(observation.lastExportedAt)}
                {observation.exportCount && observation.exportCount > 1 && (
                  <span>({observation.exportCount} ganger)</span>
                )}
              </p>
            )}
          </div>
          <div className="flex gap-sm">
            <Button
              variant={"accent"}
              size={"icon"}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(observation.id);
              }}
              aria-label="Edit observation"
            >
              <Pencil size={18} />
            </Button>
            <Button
              variant={"accent"}
              size={"icon"}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(observation.id);
              }}
              aria-label="Delete observation"
            >
              <Trash2 size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="px-lg pb-lg space-y-sm">
          {observation.species.map((speciesObs, idx) => (
            <div
              key={idx}
              className="bg-sand/50 dark:bg-bark/30 rounded-lg p-3 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-bark">
                  {speciesObs.species.PrefferedPopularname ??
                    speciesObs.species.ValidScientificName}
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {speciesObs.count && (
                    <span className="text-xs bg-moss/20 text-bark dark:text-sand px-2 py-0.5 rounded-full">
                      {speciesObs.count}
                    </span>
                  )}
                  {speciesObs.gender && (
                    <span className="text-xs bg-forest/20 text-bark dark:text-sand px-2 py-0.5 rounded-full">
                      {speciesObs.gender}
                    </span>
                  )}
                  {speciesObs.age && (
                    <span className="text-xs bg-sand dark:bg-bark/50 text-bark dark:text-sand px-2 py-0.5 rounded-full border border-slate/20">
                      {speciesObs.age}
                    </span>
                  )}
                  {speciesObs.method && (
                    <span className="text-xs bg-slate/20 text-bark dark:text-sand px-2 py-0.5 rounded-full">
                      {speciesObs.method}
                    </span>
                  )}
                  {speciesObs.activity && (
                    <span className="text-xs bg-rust/20 text-bark dark:text-sand px-2 py-0.5 rounded-full">
                      {speciesObs.activity}
                    </span>
                  )}
                </div>
              </div>
              {speciesObs.comment && (
                <p className="text-sm text-bark/80 italic border-l-2 border-moss/30 pl-2 mt-1">
                  {speciesObs.comment}
                </p>
              )}
            </div>
          ))}

          {observation.comment && (
            <div className="mt-md pt-md border-t border-slate-border">
              <p className="text-sm font-medium text-bark mb-1">
                Generell Observasjon:
              </p>
              <p className="text-sm text-bark">{observation.comment}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ObservationItem;
