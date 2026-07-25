import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileSpreadsheet,
  LayoutList,
  MapPin,
  MapPinned,
  Search,
  Table2,
  X,
} from "lucide-react";
import { useObservations } from "../context/ObservationsContext";
import { useLocations } from "../context/LocationsContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input.tsx";
import ObservationForm from "./ObservationForm.tsx";
import ExportDialog from "./ExportDialog";
import ObservationItem from "./ObservationItem";
import ObservationsTable from "./ObservationsTable.tsx";
import { getUnexportedCount } from "../queries/useExports";
import Header from "./Header.tsx";
import { twMerge } from "tailwind-merge";

interface MyObservationsProps {
  onBack: () => void;
}

function MyObservations({ onBack }: MyObservationsProps) {
  const { observations, deleteObservation } = useObservations();
  const { locations } = useLocations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocationResults, setShowLocationResults] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "table" ? "table" : "list";
  const setView = (next: "list" | "table") => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next === "list") {
          params.delete("view");
        } else {
          params.set("view", next);
        }
        return params;
      },
      { replace: true },
    );
  };

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

  const formatDateRange = (startDate?: string, endDate?: string) => {
    // Use new fields if available, otherwise fall back to old date field
    const start = startDate;
    const end = endDate;

    if (!start) return "Ukjent dato";

    // If start and end are the same or end is not set, show single date
    if (!end || start === end) {
      return formatDate(start);
    }

    // Show date range
    const startDateTime = new Date(start);
    const endDateTime = new Date(end);

    // If same day, show time range only when end time is not midnight
    if (startDateTime.toDateString() === endDateTime.toDateString()) {
      const endHasTime =
        endDateTime.getHours() !== 0 || endDateTime.getMinutes() !== 0;
      if (endHasTime) {
        return `${formatDate(start)} - ${endDateTime.toLocaleString("no-NO", {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      }
      return formatDate(start);
    }

    // Different days, show full range
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const handleDelete = (id: string) => {
    if (
      window.confirm("Er du sikker på at du vil slette denne observasjonen?")
    ) {
      deleteObservation(id);
    }
  };

  // Distinct locality names actually used across observations, so unsaved
  // (free-text) localities show up as suggestions too, not just saved ones.
  const locationSuggestions = useMemo(() => {
    const savedNamesByName = new Map(
      locations.map((loc) => [loc.name.toLowerCase(), loc]),
    );
    const seen = new Set<string>();
    const suggestions: { name: string; isSaved: boolean }[] = [];

    for (const obs of observations) {
      const name = obs.locationName?.trim();
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      suggestions.push({
        name,
        isSaved: savedNamesByName.has(name.toLowerCase()),
      });
    }

    return suggestions.sort((a, b) => a.name.localeCompare(b.name, "no"));
  }, [observations, locations]);

  const filteredLocationSuggestions = locationSearch.trim()
    ? locationSuggestions.filter((s) =>
        s.name.toLowerCase().includes(locationSearch.trim().toLowerCase()),
      )
    : locationSuggestions;

  // Filter observations by a locality name search (matches saved and unsaved names)
  const filteredObservations = locationSearch.trim()
    ? observations.filter((obs) =>
        obs.locationName
          ?.toLowerCase()
          .includes(locationSearch.trim().toLowerCase()),
      )
    : observations;

  const unexportedCount = getUnexportedCount(filteredObservations);

  const editingObservation = observations.find((obs) => obs.id === editingId);

  return (
    <div className="w-full min-h-screen bg-sand dark:bg-bark pb-16 md:pb-0">
      <Header title={"kikket på"} />
      <div
        className={twMerge(
          "mx-auto p-lg md:p-xl",
          view === "table" ? "max-w-full" : "max-w-4xl",
        )}
      >
        <div className="mb-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
          <div className="hidden md:block">
            <Button onClick={onBack} variant="outline">
              ← Tilbake til kart
            </Button>
          </div>

          {/* Location search */}
          {locationSuggestions.length > 0 && (
            <div className="relative w-full md:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none"
              />
              <Input
                type="text"
                placeholder="Søk etter lokalitet..."
                value={locationSearch}
                className={twMerge("pl-8", locationSearch && "pr-8")}
                onChange={(e) => {
                  setLocationSearch(e.target.value);
                  setShowLocationResults(true);
                }}
                onFocus={() => setShowLocationResults(true)}
                onBlur={() =>
                  setTimeout(() => setShowLocationResults(false), 150)
                }
              />
              {locationSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setLocationSearch("");
                    setShowLocationResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-bark dark:hover:text-sand"
                  aria-label="Fjern lokalitetsfilter"
                >
                  <X size={14} />
                </button>
              )}
              {showLocationResults &&
                filteredLocationSuggestions.length > 0 && (
                  <div className="absolute z-[1100] w-full mt-1 bg-white dark:bg-bark border-2 border-slate-border dark:border-slate rounded-md shadow-custom-lg overflow-hidden">
                    <div className="max-h-60 overflow-y-auto p-1">
                      {filteredLocationSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.name}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setLocationSearch(suggestion.name);
                            setShowLocationResults(false);
                          }}
                          className="w-full flex items-center gap-1.5 text-left px-2 py-2 rounded-md hover:bg-sand dark:hover:bg-forest transition-colors"
                        >
                          {suggestion.isSaved && (
                            <MapPinned
                              size={14}
                              className="shrink-0 text-violet-600 dark:text-violet-400"
                            />
                          )}
                          <span className="text-sm text-bark dark:text-sand truncate">
                            {suggestion.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center border-2 border-moss rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                className={twMerge(
                  "p-2 transition-colors",
                  view === "list"
                    ? "bg-moss text-white"
                    : "bg-white dark:bg-bark text-bark dark:text-sand hover:bg-sand dark:hover:bg-forest",
                )}
                aria-label="Listevisning"
                title="Listevisning"
              >
                <LayoutList size={18} />
              </button>
              <button
                type="button"
                onClick={() => setView("table")}
                aria-pressed={view === "table"}
                className={twMerge(
                  "p-2 transition-colors",
                  view === "table"
                    ? "bg-moss text-white"
                    : "bg-white dark:bg-bark text-bark dark:text-sand hover:bg-sand dark:hover:bg-forest",
                )}
                aria-label="Tabellvisning"
                title="Tabellvisning"
              >
                <Table2 size={18} />
              </button>
            </div>

            {observations.length > 0 && (
              <Button onClick={() => setShowExportDialog(true)}>
                <FileSpreadsheet size={20} className="mr-2" />
                Eksporter til Excel
                {unexportedCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-moss text-white text-xs rounded-full">
                    {unexportedCount} nye
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>

        {filteredObservations.length === 0 && observations.length > 0 ? (
          <div className="text-center py-xxl">
            <MapPin size={48} className="mx-auto text-slate mb-md" />
            <p className="text-lg text-slate">
              Ingen observasjoner på denne lokaliteten
            </p>
            <p className="text-sm text-slate mt-sm">
              Prøv et annet filter eller legg til en ny observasjon!
            </p>
          </div>
        ) : observations.length === 0 ? (
          <div className="text-center py-xxl">
            <MapPin size={48} className="mx-auto text-slate mb-md" />
            <p className="text-lg text-slate">Ingen observasjoner ennå</p>
            <p className="text-sm text-slate mt-sm">
              Klikk på kartet for å legge til din første observasjon!
            </p>
          </div>
        ) : view === "table" ? (
          <ObservationsTable
            observations={filteredObservations}
            onEdit={setEditingId}
          />
        ) : (
          <div className="flex flex-col space-y-md">
            {filteredObservations.map((observation) => (
              <ObservationItem
                key={observation.id}
                observation={observation}
                onEdit={setEditingId}
                onDelete={handleDelete}
                formatDate={formatDate}
                formatDateRange={formatDateRange}
              />
            ))}
          </div>
        )}
      </div>

      {editingId && editingObservation && (
        <ObservationForm
          isOpen
          location={editingObservation.location}
          observation={editingObservation}
          onClose={() => setEditingId(null)}
        />
      )}

      <ExportDialog
        observations={observations}
        onClose={() => setShowExportDialog(false)}
        isOpen={showExportDialog}
      />
    </div>
  );
}

export default MyObservations;
