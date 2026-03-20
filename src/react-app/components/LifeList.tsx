import { useMemo, useState } from "react";
import { Search, ListChecks, ArrowUpDown } from "lucide-react";
import { useObservations } from "../context/ObservationsContext";
import { ThemeToggle } from "./ThemeToggle";
import { AuthButton } from "./AuthButton";
import { Button } from "./ui/button";
import { getLifeList, LifeListEntry } from "../lib/utils";

type SortField = "name" | "count" | "firstSeen" | "lastSeen" | "observations";
type SortDirection = "asc" | "desc";

interface LifeListProps {
  onBack: () => void;
  setShowLoginForm: (show: boolean) => void;
}

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

function LifeList({ onBack, setShowLoginForm }: LifeListProps) {
  const { observations } = useObservations();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const lifeList = useMemo(() => getLifeList(observations), [observations]);

  const filteredAndSorted = useMemo(() => {
    let entries = lifeList;

    // Filter by search term
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

    // Sort
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

  // Group by taxonomic group for summary stats
  const groupStats = useMemo(() => {
    const groups = new Map<string, number>();
    for (const entry of lifeList) {
      const group = entry.species.TaxonGroup || "Ukjent";
      groups.set(group, (groups.get(group) || 0) + 1);
    }
    return Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
  }, [lifeList]);

  return (
    <div className="w-full min-h-screen bg-sand dark:bg-bark pb-16 md:pb-0">
      <header className="bg-forest text-sand p-lg md:p-xl relative">
        <div className="max-w-4xl mx-auto ml-16">
          <h1 className="text-sand m-0 text-[clamp(2rem,6vw,3rem)] tracking-wider">
            artsliste
          </h1>
        </div>
        <div className="absolute left-lg top-1/2 -translate-y-1/2">
          <ThemeToggle />
        </div>
        <div className="absolute right-lg top-1/2 -translate-y-1/2 md:hidden flex items-center gap-2">
          <AuthButton setShowLoginForm={setShowLoginForm} />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-lg md:p-xl">
        {/* Back button and summary */}
        <div className="mb-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
          <div className="hidden md:block">
            <Button onClick={onBack} variant="outline">
              ← Tilbake til kart
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        {lifeList.length > 0 && (
          <div className="mb-lg grid grid-cols-2 md:grid-cols-4 gap-md">
            <div className="bg-white dark:bg-forest rounded-md border-2 border-moss p-md text-center">
              <div className="text-2xl font-bold text-bark dark:text-sand">
                {lifeList.length}
              </div>
              <div className="text-sm text-slate">Unike arter</div>
            </div>
            <div className="bg-white dark:bg-forest rounded-md border-2 border-moss p-md text-center">
              <div className="text-2xl font-bold text-bark dark:text-sand">
                {observations.length}
              </div>
              <div className="text-sm text-slate">Observasjoner</div>
            </div>
            <div className="bg-white dark:bg-forest rounded-md border-2 border-moss p-md text-center">
              <div className="text-2xl font-bold text-bark dark:text-sand">
                {lifeList.reduce((sum, e) => sum + e.totalCount, 0)}
              </div>
              <div className="text-sm text-slate">Totalt antall</div>
            </div>
            <div className="bg-white dark:bg-forest rounded-md border-2 border-moss p-md text-center">
              <div className="text-2xl font-bold text-bark dark:text-sand">
                {groupStats.length}
              </div>
              <div className="text-sm text-slate">Artsgrupper</div>
            </div>
          </div>
        )}

        {/* Group breakdown */}
        {groupStats.length > 0 && (
          <div className="mb-lg flex flex-wrap gap-2">
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
          <div className="mb-lg flex flex-col sm:flex-row gap-md">
            <div className="relative flex-1">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate"
              />
              <input
                type="text"
                placeholder="Søk etter art, familie eller orden..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 p-2 rounded border-2 border-moss bg-white dark:bg-bark text-bark dark:text-sand placeholder:text-slate"
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
        {filteredAndSorted.length === 0 && lifeList.length > 0 ? (
          <div className="text-center py-xxl">
            <Search size={48} className="mx-auto text-slate mb-md" />
            <p className="text-lg text-slate">
              Ingen arter samsvarer med søket
            </p>
          </div>
        ) : lifeList.length === 0 ? (
          <div className="text-center py-xxl">
            <ListChecks size={48} className="mx-auto text-slate mb-md" />
            <p className="text-lg text-slate">Ingen arter registrert ennå</p>
            <p className="text-sm text-slate mt-sm">
              Legg til observasjoner fra kartet for å bygge opp artslisten din!
            </p>
          </div>
        ) : (
          <div className="space-y-sm">
            <div className="text-sm text-slate mb-sm">
              Viser {filteredAndSorted.length} av {lifeList.length} arter
            </div>
            {filteredAndSorted.map((entry) => (
              <LifeListItem key={entry.species.Id} entry={entry} />
            ))}
          </div>
        )}
      </div>
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
          : "bg-white dark:bg-bark text-bark dark:text-sand border-moss hover:bg-sand-dark dark:hover:bg-forest/50"
      }`}
    >
      {label}
      {isActive && (
        <ArrowUpDown
          size={14}
          className={direction === "desc" ? "rotate-180" : ""}
        />
      )}
    </button>
  );
}

function LifeListItem({ entry }: { entry: LifeListEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusBadge = getStatusBadge(entry.species.Status);

  return (
    <div className="bg-white dark:bg-forest rounded-md border-2 border-moss hover:bg-sand/50 dark:hover:bg-bark/50 transition-colors">
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
          <div className="text-sm text-slate italic">
            {entry.species.ValidScientificName}
          </div>
        </div>
        <div className="flex items-center gap-md text-right shrink-0 ml-2">
          <div>
            <div className="font-semibold text-bark dark:text-sand">
              {entry.totalCount}
            </div>
            <div className="text-xs text-slate">individer</div>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm text-bark dark:text-sand">
              {entry.observationCount}
            </div>
            <div className="text-xs text-slate">obs.</div>
          </div>
          <span className="text-slate text-sm">{isExpanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="px-sm pb-sm border-t border-moss/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm pt-sm text-sm">
            <div>
              <span className="text-slate">Første observasjon: </span>
              <span className="text-bark dark:text-sand">
                {formatShortDate(entry.firstSeen)}
              </span>
              {entry.firstLocation && (
                <span className="text-slate text-xs block">
                  {entry.firstLocation}
                </span>
              )}
            </div>
            <div>
              <span className="text-slate">Siste observasjon: </span>
              <span className="text-bark dark:text-sand">
                {formatShortDate(entry.lastSeen)}
              </span>
              {entry.lastLocation && (
                <span className="text-slate text-xs block">
                  {entry.lastLocation}
                </span>
              )}
            </div>
            {entry.species.TaxonGroup && (
              <div>
                <span className="text-slate">Artsgruppe: </span>
                <span className="text-bark dark:text-sand">
                  {entry.species.TaxonGroup}
                </span>
              </div>
            )}
            {entry.species.Family && (
              <div>
                <span className="text-slate">Familie: </span>
                <span className="text-bark dark:text-sand italic">
                  {entry.species.Family}
                </span>
              </div>
            )}
            {entry.species.Order && (
              <div>
                <span className="text-slate">Orden: </span>
                <span className="text-bark dark:text-sand italic">
                  {entry.species.Order}
                </span>
              </div>
            )}
            {entry.species.Status && (
              <div>
                <span className="text-slate">Rødlistestatus: </span>
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

export default LifeList;
