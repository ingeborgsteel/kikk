import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Binoculars,
  Calendar,
  MapPin,
  MapPinned,
  Plus,
  TrendingUp,
} from "lucide-react";
import { useObservations } from "../context/ObservationsContext";
import { useLocations } from "../context/LocationsContext";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Observation } from "../types/observation";
import { UserLocation } from "../types/location";
import ObservationForm from "./ObservationForm.tsx";

interface StatsDashboardProps {
  onBack: () => void;
}

interface SpeciesStat {
  name: string;
  scientificName: string;
  count: number;
  taxonId: number;
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

function computeSpeciesStats(observations: Observation[]): SpeciesStat[] {
  const speciesMap = new Map<
    number,
    { name: string; scientificName: string; count: number }
  >();

  for (const obs of observations) {
    for (const s of obs.species) {
      const taxonId = s.species.TaxonId;
      const existing = speciesMap.get(taxonId);
      if (existing) {
        existing.count += s.count;
      } else {
        speciesMap.set(taxonId, {
          name: s.species.PrefferedPopularname,
          scientificName: s.species.ValidScientificName,
          count: s.count,
        });
      }
    }
  }

  return Array.from(speciesMap.entries())
    .map(([taxonId, data]) => ({ taxonId, ...data }))
    .sort((a, b) => b.count - a.count);
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

  const uniqueSpeciesCount = useMemo(
    () => countUniqueSpecies(observations),
    [observations],
  );
  const totalIndividuals = useMemo(
    () => countTotalIndividuals(observations),
    [observations],
  );
  const speciesStats = useMemo(
    () => computeSpeciesStats(observations),
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

  const handleAddAtLocation = (stat: LocationStat) => {
    const userLocation = stat.locationId
      ? locations.find((l) => l.id === stat.locationId)
      : undefined;
    setAddFormLocation({ lat: stat.lat, lng: stat.lng });
    setPresetLocation(userLocation || null);
    setAddFormOpen(true);
  };

  const handleAddFromSpecies = () => {
    // Navigate to map so user can pick a location for a new observation
    navigate("/");
  };

  const handleCloseForm = () => {
    setAddFormOpen(false);
    setAddFormLocation(null);
    setPresetLocation(null);
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

        {/* Observations over time */}
        <div className="bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30 p-md">
          <h2 className="text-lg font-bold text-bark dark:text-sand mb-md flex items-center gap-sm">
            <BarChart3 size={20} className="text-moss" />
            Observasjoner siste 12 måneder
          </h2>
          <SimpleBarChart data={monthlyStats} />
        </div>

        {/* Most observed species */}
        <div className="bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30 p-md">
          <h2 className="text-lg font-bold text-bark dark:text-sand mb-md flex items-center gap-sm">
            <TrendingUp size={20} className="text-moss" />
            Mest observerte arter
          </h2>
          {speciesStats.length === 0 ? (
            <p className="text-sm text-bark/60 dark:text-sand/60">
              Ingen arter registrert ennå.
            </p>
          ) : (
            <div className="space-y-sm">
              {speciesStats.slice(0, 10).map((stat) => (
                <div
                  key={stat.taxonId}
                  className="flex items-center justify-between p-sm rounded-md hover:bg-sand dark:hover:bg-bark/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-bark dark:text-sand truncate">
                      {stat.name}
                    </div>
                    <div className="text-xs text-bark/60 dark:text-sand/60 italic truncate">
                      {stat.scientificName}
                    </div>
                  </div>
                  <div className="flex items-center gap-sm ml-sm">
                    <span className="text-sm font-semibold text-moss whitespace-nowrap">
                      {stat.count} {stat.count === 1 ? "individ" : "individer"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleAddFromSpecies}
                      aria-label={`Legg til observasjon av ${stat.name}`}
                      title="Ny observasjon"
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
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
