import { useState } from 'react';
import { MapPin, Pencil, Trash2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Observation } from '../types/observation';
import { Button } from './ui/button';

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
  formatDateRange,
}: ObservationItemProps) {
  // Automatically collapse exported observations
  const [isExpanded, setIsExpanded] = useState(!observation.lastExportedAt);

  const isExported = !!observation.lastExportedAt;

  return (
    <div
      className={`bg-white rounded-lg shadow-custom border-2 relative transition-all ${
        !isExported ? 'border-moss border-opacity-60' : 'border-slate-border'
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
        className={`p-lg ${isExported ? 'cursor-pointer hover:bg-sand hover:bg-opacity-30' : ''}`}
        onClick={() => isExported && setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start mb-md">
          <div className="flex-1">
            <div className="flex items-center gap-sm">
              {observation.locationName && (
                <div className="font-medium text-bark">
                  {observation.locationName}
                </div>
              )}
              {isExported && (
                <div
                  className="text-slate hover:text-bark transition-colors"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              )}
            </div>
            <div className="flex items-center gap-sm text-sm text-slate mb-xs">
              <MapPin size={16} />
              <span>
                {observation.location.lat.toFixed(4)}, {observation.location.lng.toFixed(4)}
              </span>
            </div>
            <p className="text-sm text-slate">
              {formatDateRange(observation.startDate, observation.endDate)} • ±
              {observation.uncertaintyRadius}m
            </p>
            {isExported && (
              <p className="text-xs text-slate mt-1">
                Sist eksportert: {formatDate(observation.lastExportedAt)}
                {observation.exportCount && observation.exportCount > 1 && (
                  <span> ({observation.exportCount} ganger)</span>
                )}
              </p>
            )}
          </div>
          <div className="flex gap-sm">
            <Button
              variant={'accent'}
              size={'icon'}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(observation.id);
              }}
              aria-label="Edit observation"
            >
              <Pencil size={18} />
            </Button>
            <Button
              variant={'accent'}
              size={'icon'}
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
          <h3 className="font-semibold text-bark">Arter Observert:</h3>
          {observation.species.map((speciesObs, idx) => (
            <div key={idx} className="pl-md border-l-2 border-moss">
              <div className="font-medium text-bark">
                {speciesObs.species.PrefferedPopularname}
              </div>
              <div className="text-sm text-slate italic">
                {speciesObs.species.ValidScientificName}
              </div>
              <div className="text-sm text-slate">
                Count: {speciesObs.count} • Gender: {speciesObs.gender}
              </div>
              {speciesObs.comment && (
                <div className="text-sm text-bark mt-1 italic">
                  "{speciesObs.comment}"
                </div>
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
