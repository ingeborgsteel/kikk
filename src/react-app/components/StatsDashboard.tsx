import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Binoculars,
  Calendar,
  ListChecks,
  MapPin,
  MapPinned,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { useObservations } from "../context/ObservationsContext";
import { useLocations } from "../context/LocationsContext";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Observation } from "../types/observation";
import { UserLocation } from "../types/location";
import { TaxonRecord } from "../types/artsdatabanken";
import { getLifeList, LifeListEntry } from "../lib/utils";
import ObservationForm from "./ObservationForm.tsx";

type SortField = "name" | "count" | "firstSeen" | "lastSeen" | "observations";
type SortDirection = "asc" | "desc";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  CR: { label: "Kritisk truet", color: "bg-red-600 text-white" },
  EN: { label: "Sterkt truet", color: "bg-orange-600 text-white" },
  VU: { label: "Sårbar", color: "bg-yellow-600 text-white" },
  NT: { label: "Nær truet", color: "bg-sky text-bark" },
  DD: { label: "Datamangel", color: "bg-slate text-white" },
  LC: { label: "Livskraftig", color: "bg-moss text-white" },
};

function getStatusBadge(status: string | undefined) {
  if (!status) return null;
  const info = STATUS_LABELS[status];
  if (!info) return null;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${info.color}`}
      title={info.label}
    >
      {status}
    </span>
  );
}

function formatShortDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("no-NO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface StatsDashboardProps {
  onBack: () => void;
}

interface LocationStat {
  locationId: string | undefined;
  locationName: string;
  lat: number;
  lng: number;
  count: number;
}

interface MonthStat {
  label: string;
  count: number;
}


function computeLocationStats(observations: Observation[]): LocationStat[] {
  const locationMap = new Map<
    string,
    {
      locationId: string | undefined;
      locationName: string;
      lat: number;
      lng: number;
      count: number;
    }
  >();

  for (const obs of observations) {
    const key = obs.locationId || `${obs.location.lat},${obs.location.lng}`;
    const existing = locationMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      locationMap.set(key, {
        locationId: obs.locationId,
        locationName:
          obs.locationName ||
          `${obs.location.lat.toFixed(4)}, ${obs.location.lng.toFixed(4)}`,
        lat: obs.location.lat,
        lng: obs.location.lng,
        count: 1,
      });
    }
  }

  return Array.from(locationMap.values()).sort((a, b) => b.count - a.count);
}

function computeMonthlyStats(observations: Observation[]): MonthStat[] {
  const monthMap = new Map<string, number>();
  const monthLabels: string[] = [];

  // Generate last 12 months
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, 0);
    monthLabels.push(key);
  }

  for (const obs of observations) {
    const date = new Date(obs.startDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap.has(key)) {
      monthMap.set(key, monthMap.get(key)! + 1);
    }
  }

  return monthLabels.map((key) => ({
    label: (() => {
      const [y, m] = key.split("-");
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      return d.toLocaleString("no-NO", { month: "short" });
    })(),
    count: monthMap.get(key) || 0,
  }));
}

function countUniqueSpecies(observations: Observation[]): number {
  const seen = new Set<number>();
  for (const obs of observations) {
    for (const s of obs.species) {
      seen.add(s.species.TaxonId);
    }
  }
  return seen.size;
}

function countTotalIndividuals(observations: Observation[]): number {
  let total = 0;
  for (const obs of observations) {
    for (const s of obs.species) {
      total += s.count;
    }
  }
  return total;
}

/** Simple bar chart rendered with plain divs */
function SimpleBarChart({ data }: { data: MonthStat[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-bark/60 dark:text-sand/60">
            {d.count > 0 ? d.count : ""}
          </span>
          <div
            className="w-full bg-moss/80 dark:bg-moss/60 rounded-t transition-all min-h-[2px]"
            style={{ height: `${(d.count / maxCount) * 120}px` }}
          />
          <span className="text-[10px] text-bark/60 dark:text-sand/60 truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function StatsDashboard({ onBack }: StatsDashboardProps) {
  const { observations } = useObservations();
  const { locations } = useLocations();
  const navigate = useNavigate();

  // State for "add observation" from stats
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [addFormLocation, setAddFormLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [presetLocation, setPresetLocation] = useState<UserLocation | null>(
    null,
  );
  const [addFormSpecies, setAddFormSpecies] = useState<TaxonRecord | null>(
    null,
  );

  // Life list state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const uniqueSpeciesCount = useMemo(
    () => countUniqueSpecies(observations),
    [observations],
  );
  const totalIndividuals = useMemo(
    () => countTotalIndividuals(observations),
    [observations],
  );
  const locationStats = useMemo(
    () => computeLocationStats(observations),
    [observations],
  );
  const monthlyStats = useMemo(
    () => computeMonthlyStats(observations),
    [observations],
  );

  const lifeList = useMemo(() => getLifeList(observations), [observations]);

  const filteredAndSorted = useMemo(() => {
    let entries = lifeList;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      entries = entries.filter(
        (entry) =>
          entry.species.PrefferedPopularname?.toLowerCase().includes(term) ||
          entry.species.ValidScientificName?.toLowerCase().includes(term) ||
          entry.species.Family?.toLowerCase().includes(term) ||
          entry.species.Order?.toLowerCase().includes(term),
      );
    }

    const sorted = [...entries].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = (
            a.species.PrefferedPopularname || a.species.ValidScientificName
          ).localeCompare(
            b.species.PrefferedPopularname || b.species.ValidScientificName,
            "no",
          );
          break;
        case "count":
          cmp = a.totalCount - b.totalCount;
          break;
        case "observations":
          cmp = a.observationCount - b.observationCount;
          break;
        case "firstSeen":
          cmp = a.firstSeen.localeCompare(b.firstSeen);
          break;
        case "lastSeen":
          cmp = a.lastSeen.localeCompare(b.lastSeen);
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [lifeList, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "name" ? "asc" : "desc");
    }
  };

  const groupStats = useMemo(() => {
    const groups = new Map<string, number>();
    for (const entry of lifeList) {
      const group = entry.species.TaxonGroup || "Ukjent";
      groups.set(group, (groups.get(group) || 0) + 1);
    }
    return Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
  }, [lifeList]);

  const handleAddAtLocation = (stat: LocationStat) => {
    const userLocation = stat.locationId
      ? locations.find((l) => l.id === stat.locationId)
      : undefined;
    setAddFormLocation({ lat: stat.lat, lng: stat.lng });
    setPresetLocation(userLocation || null);
    setAddFormOpen(true);
  };

  const handleAddFromSpecies = (species: TaxonRecord) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setAddFormLocation({ lat: latitude, lng: longitude });
          setPresetLocation(null);
          setAddFormSpecies(species);
          setAddFormOpen(true);
        },
        () => {
          // Geolocation denied or unavailable — fall back to map
          navigate("/");
        },
      );
    } else {
      navigate("/");
    }
  };

  const handleCloseForm = () => {
    setAddFormOpen(false);
    setAddFormLocation(null);
    setPresetLocation(null);
    setAddFormSpecies(null);
  };

  if (observations.length === 0) {
    return (
      <div className="w-full min-h-screen bg-sand dark:bg-bark pb-16 md:pb-0">
        <header className="bg-forest text-sand p-lg md:p-xl relative">
          <div className="max-w-4xl mx-auto ml-16">
            <h1 className="text-sand m-0 text-[clamp(2rem,6vw,3rem)] tracking-wider">
              statistikk
            </h1>
          </div>
          <div className="absolute left-lg top-1/2 -translate-y-1/2">
            <ThemeToggle />
          </div>
        </header>
        <div className="max-w-4xl mx-auto p-lg md:p-xl">
          <div className="hidden md:block mb-lg">
            <Button onClick={onBack} variant="outline">
              ← Tilbake til kart
            </Button>
          </div>
          <div className="text-center py-xxl">
            <BarChart3 size={48} className="mx-auto text-slate mb-md" />
            <p className="text-lg text-slate">Ingen observasjoner ennå</p>
            <p className="text-sm text-slate mt-sm">
              Klikk på kartet for å legge til din første observasjon!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-sand dark:bg-bark pb-16 md:pb-0">
      <header className="bg-forest text-sand p-lg md:p-xl relative">
        <div className="max-w-4xl mx-auto ml-16">
          <h1 className="text-sand m-0 text-[clamp(2rem,6vw,3rem)] tracking-wider">
            statistikk
          </h1>
        </div>
        <div className="absolute left-lg top-1/2 -translate-y-1/2">
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-lg md:p-xl space-y-lg">
        <div className="hidden md:block">
          <Button onClick={onBack} variant="outline">
            ← Tilbake til kart
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          <div className="bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30 p-md text-center">
            <Binoculars
              size={24}
              className="mx-auto text-moss mb-sm"
            />
            <div className="text-2xl font-bold text-bark dark:text-sand">
              {observations.length}
            </div>
            <div className="text-xs text-bark/60 dark:text-sand/60">
              Observasjoner
            </div>
          </div>
          <div className="bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30 p-md text-center">
            <TrendingUp
              size={24}
              className="mx-auto text-moss mb-sm"
            />
            <div className="text-2xl font-bold text-bark dark:text-sand">
              {uniqueSpeciesCount}
            </div>
            <div className="text-xs text-bark/60 dark:text-sand/60">
              Unike arter
            </div>
          </div>
          <div className="bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30 p-md text-center">
            <Calendar
              size={24}
              className="mx-auto text-moss mb-sm"
            />
            <div className="text-2xl font-bold text-bark dark:text-sand">
              {totalIndividuals}
            </div>
            <div className="text-xs text-bark/60 dark:text-sand/60">
              Individer totalt
            </div>
          </div>
          <div className="bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30 p-md text-center">
            <MapPin
              size={24}
              className="mx-auto text-moss mb-sm"
            />
            <div className="text-2xl font-bold text-bark dark:text-sand">
              {locationStats.length}
            </div>
            <div className="text-xs text-bark/60 dark:text-sand/60">
              Lokaliteter
            </div>
          </div>
        </div>

        {/* Life list / Artsliste */}
        <div className="bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30 p-md">
          <h2 className="text-lg font-bold text-bark dark:text-sand mb-md flex items-center gap-sm">
            <ListChecks size={20} className="text-moss" />
            Artsliste
          </h2>

          {/* Group breakdown badges */}
          {groupStats.length > 0 && (
            <div className="mb-md flex flex-wrap gap-2">
              {groupStats.map(([group, count]) => (
                <span
                  key={group}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-moss/20 text-bark dark:text-sand text-sm border border-moss/30"
                >
                  {group}
                  <span className="font-semibold">{count}</span>
                </span>
              ))}
            </div>
          )}

          {/* Search and sort controls */}
          {lifeList.length > 0 && (
            <div className="mb-md flex flex-col sm:flex-row gap-sm">
              <div className="relative flex-1">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-bark/40 dark:text-sand/40"
                />
                <input
                  type="text"
                  placeholder="Søk etter art, familie eller orden..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 p-2 rounded border-2 border-moss/30 bg-white dark:bg-bark text-bark dark:text-sand placeholder:text-bark/40 dark:placeholder:text-sand/40"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <SortButton
                  label="Navn"
                  field="name"
                  currentField={sortField}
                  direction={sortDirection}
                  onClick={handleSort}
                />
                <SortButton
                  label="Antall"
                  field="count"
                  currentField={sortField}
                  direction={sortDirection}
                  onClick={handleSort}
                />
                <SortButton
                  label="Sist sett"
                  field="lastSeen"
                  currentField={sortField}
                  direction={sortDirection}
                  onClick={handleSort}
                />
              </div>
            </div>
          )}

          {/* Species list */}
          {lifeList.length === 0 ? (
            <p className="text-sm text-bark/60 dark:text-sand/60">
              Ingen arter registrert ennå.
            </p>
          ) : filteredAndSorted.length === 0 ? (
            <div className="text-center py-md">
              <Search size={32} className="mx-auto text-bark/30 dark:text-sand/30 mb-sm" />
              <p className="text-sm text-bark/60 dark:text-sand/60">
                Ingen arter samsvarer med søket
              </p>
            </div>
          ) : (
            <div className="space-y-sm">
              <div className="text-sm text-bark/60 dark:text-sand/60 mb-sm">
                Viser {filteredAndSorted.length} av {lifeList.length} arter
              </div>
              {filteredAndSorted.map((entry) => (
                <LifeListItem key={entry.species.Id} entry={entry} onAdd={handleAddFromSpecies} />
              ))}
            </div>
          )}
        </div>

        {/* Observations over time */}
        <div className="bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30 p-md">
          <h2 className="text-lg font-bold text-bark dark:text-sand mb-md flex items-center gap-sm">
            <BarChart3 size={20} className="text-moss" />
            Observasjoner siste 12 måneder
          </h2>
          <SimpleBarChart data={monthlyStats} />
        </div>

        {/* Most active locations */}
        <div className="bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30 p-md">
          <h2 className="text-lg font-bold text-bark dark:text-sand mb-md flex items-center gap-sm">
            <MapPinned size={20} className="text-moss" />
            Mest aktive lokaliteter
          </h2>
          {locationStats.length === 0 ? (
            <p className="text-sm text-bark/60 dark:text-sand/60">
              Ingen lokaliteter registrert ennå.
            </p>
          ) : (
            <div className="space-y-sm">
              {locationStats.slice(0, 10).map((stat, i) => (
                <div
                  key={stat.locationId || i}
                  className="flex items-center justify-between p-sm rounded-md hover:bg-sand dark:hover:bg-bark/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-bark dark:text-sand flex items-center gap-1 truncate">
                      {stat.locationId && (
                        <MapPinned
                          size={14}
                          className="text-violet-600 dark:text-violet-400 shrink-0"
                        />
                      )}
                      {stat.locationName}
                    </div>
                    <div className="text-xs text-bark/60 dark:text-sand/60">
                      {stat.lat.toFixed(4)}, {stat.lng.toFixed(4)}
                    </div>
                  </div>
                  <div className="flex items-center gap-sm ml-sm">
                    <span className="text-sm font-semibold text-moss whitespace-nowrap">
                      {stat.count}{" "}
                      {stat.count === 1 ? "observasjon" : "observasjoner"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAddAtLocation(stat)}
                      aria-label={`Ny observasjon på ${stat.locationName}`}
                      title="Ny observasjon her"
                      className="text-moss hover:text-rust shrink-0"
                    >
                      <Plus size={18} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Observation form for adding from stats */}
      {addFormLocation && (
        <ObservationForm
          isOpen={addFormOpen}
          location={addFormLocation}
          presetLocation={presetLocation}
          presetSpecies={addFormSpecies}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}

function SortButton({
  label,
  field,
  currentField,
  direction,
  onClick,
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onClick: (field: SortField) => void;
}) {
  const isActive = field === currentField;
  return (
    <button
      onClick={() => onClick(field)}
      className={`flex items-center gap-1 px-3 py-1.5 rounded border text-sm transition-colors ${
        isActive
          ? "bg-forest text-sand border-forest"
          : "bg-white dark:bg-bark text-bark dark:text-sand border-moss/30 hover:bg-sand dark:hover:bg-forest/50"
      }`}
    >
      {label}
      {isActive && (
        direction === "asc"
          ? <ArrowUp size={14} />
          : <ArrowDown size={14} />
      )}
    </button>
  );
}

function LifeListItem({ entry, onAdd }: { entry: LifeListEntry; onAdd: (species: TaxonRecord) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusBadge = getStatusBadge(entry.species.Status);

  return (
    <div className="rounded-md border border-moss/30 hover:bg-sand dark:hover:bg-bark/50 transition-colors">
      <div
        className="flex items-center justify-between p-sm cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-bark dark:text-sand truncate">
              {entry.species.PrefferedPopularname ||
                entry.species.ValidScientificName}
            </span>
            {statusBadge}
          </div>
          <div className="text-xs text-bark/60 dark:text-sand/60 italic">
            {entry.species.ValidScientificName}
          </div>
        </div>
        <div className="flex items-center gap-md text-right shrink-0 ml-2">
          <div>
            <div className="font-semibold text-bark dark:text-sand">
              {entry.totalCount}
            </div>
            <div className="text-xs text-bark/60 dark:text-sand/60">
              individer
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm text-bark dark:text-sand">
              {entry.observationCount}
            </div>
            <div className="text-xs text-bark/60 dark:text-sand/60">obs.</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(entry.species);
            }}
            aria-label={`Legg til observasjon av ${entry.species.PrefferedPopularname || entry.species.ValidScientificName}`}
            title="Ny observasjon"
            className="text-moss hover:text-rust shrink-0"
          >
            <Plus size={18} />
          </Button>
          <span className="text-bark/40 dark:text-sand/40 text-sm">
            {isExpanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="px-sm pb-sm border-t border-moss/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm pt-sm text-sm">
            <div>
              <span className="text-bark/60 dark:text-sand/60">
                Første observasjon:{" "}
              </span>
              <span className="text-bark dark:text-sand">
                {formatShortDate(entry.firstSeen)}
              </span>
              {entry.firstLocation && (
                <span className="text-bark/60 dark:text-sand/60 text-xs block">
                  {entry.firstLocation}
                </span>
              )}
            </div>
            <div>
              <span className="text-bark/60 dark:text-sand/60">
                Siste observasjon:{" "}
              </span>
              <span className="text-bark dark:text-sand">
                {formatShortDate(entry.lastSeen)}
              </span>
              {entry.lastLocation && (
                <span className="text-bark/60 dark:text-sand/60 text-xs block">
                  {entry.lastLocation}
                </span>
              )}
            </div>
            {entry.species.TaxonGroup && (
              <div>
                <span className="text-bark/60 dark:text-sand/60">
                  Artsgruppe:{" "}
                </span>
                <span className="text-bark dark:text-sand">
                  {entry.species.TaxonGroup}
                </span>
              </div>
            )}
            {entry.species.Family && (
              <div>
                <span className="text-bark/60 dark:text-sand/60">
                  Familie:{" "}
                </span>
                <span className="text-bark dark:text-sand italic">
                  {entry.species.Family}
                </span>
              </div>
            )}
            {entry.species.Order && (
              <div>
                <span className="text-bark/60 dark:text-sand/60">
                  Orden:{" "}
                </span>
                <span className="text-bark dark:text-sand italic">
                  {entry.species.Order}
                </span>
              </div>
            )}
            {entry.species.Status && (
              <div>
                <span className="text-bark/60 dark:text-sand/60">
                  Rødlistestatus:{" "}
                </span>
                {getStatusBadge(entry.species.Status)}
                {STATUS_LABELS[entry.species.Status] && (
                  <span className="text-bark dark:text-sand ml-1">
                    ({STATUS_LABELS[entry.species.Status].label})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
