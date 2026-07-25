import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Observation, Species } from "../types/observation.ts";
import { useObservations } from "../context/ObservationsContext.tsx";
import { Input } from "./ui/input.tsx";
import { Textarea } from "./ui/textarea.tsx";
import { Combobox, ComboboxOption } from "./ui/combobox.tsx";
import { DatePicker } from "./ui/date-picker.tsx";
import { TimePicker } from "./ui/time-picker.tsx";
import { Button } from "./ui/button.tsx";
import { getAgeOptionsForTaxonGroup } from "../lib/ageOptions.ts";
import { getGenderOptionsForTaxonGroup } from "../lib/genderOptions.ts";
import { getUnitOptionsForTaxonGroup } from "../lib/unitOptions.ts";
import { getMethodOptionsForTaxonGroup } from "../lib/methodOptions.ts";
import { getActivityOptionsForTaxonGroup } from "../lib/activityOptions.ts";
import { twMerge } from "tailwind-merge";

const OBSERVATIONS_PER_PAGE = 20;

interface ObservationsTableProps {
  observations: Observation[];
}

interface FlatRow {
  rowId: string;
  observation: Observation;
  species: Species;
  speciesIndex: number;
  isNewGroup: boolean;
  groupParity: number;
}

const cellClass =
  "p-0 text-sm text-bark dark:text-sand whitespace-nowrap align-middle";
const headerClass =
  "px-2 py-2 text-left text-xs font-semibold text-bark dark:text-sand whitespace-nowrap sticky top-0 bg-sand dark:bg-forest z-10 border-b-2 border-moss";

const formatDate = (value?: string) =>
  value && dayjs(value).isValid() ? dayjs(value).format("DD.MM.YYYY") : "";
const formatTime = (value?: string) =>
  value && dayjs(value).isValid() ? dayjs(value).format("HH:mm") : "";

const columnHelper = createColumnHelper<FlatRow>();

/** Text/number input that auto-focuses and selects its content the moment it's mounted, so the first click into edit mode is ready to type over. */
const AutoFocusInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return <Input ref={ref} variant="ghost" {...props} />;
};

const AutoFocusTextarea = (
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return <Textarea ref={ref} variant="ghost" {...props} />;
};

const ObservationsTable = ({ observations }: ObservationsTableProps) => {
  const { updateObservation, deleteObservation } = useObservations();
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const setObservationField = <K extends keyof Observation>(
    observation: Observation,
    field: K,
    value: Observation[K],
  ) => {
    updateObservation({ ...observation, [field]: value });
  };

  const setSpeciesField = <K extends keyof Species>(
    observation: Observation,
    speciesIndex: number,
    field: K,
    value: Species[K],
  ) => {
    const nextSpecies = observation.species.map((s, i) =>
      i === speciesIndex ? { ...s, [field]: value } : s,
    );
    updateObservation({ ...observation, species: nextSpecies });
  };

  const removeSpeciesRow = (observation: Observation, speciesIndex: number) => {
    const removed = observation.species[speciesIndex];
    const label =
      removed.species.PrefferedPopularname ??
      removed.species.ValidScientificName ??
      "denne arten";

    if (observation.species.length === 1) {
      const confirmed = window.confirm(
        `${label} er den siste arten på observasjonen. Fjerner du den, slettes hele observasjonen. Vil du fortsette?`,
      );
      if (!confirmed) return;
      deleteObservation(observation.id);
      return;
    }

    const confirmed = window.confirm(`Fjern ${label} fra observasjonen?`);
    if (!confirmed) return;
    updateObservation({
      ...observation,
      species: observation.species.filter((_, i) => i !== speciesIndex),
    });
  };

  const [page, setPage] = useState(0);

  const goToPage = (next: number) => {
    setPage(next);
    setEditingCell(null);
  };

  const sortedObservations = useMemo(
    () =>
      [...observations].sort((a, b) =>
        dayjs(b.startDate).diff(dayjs(a.startDate)),
      ),
    [observations],
  );

  const pageCount = Math.max(
    1,
    Math.ceil(sortedObservations.length / OBSERVATIONS_PER_PAGE),
  );
  const clampedPage = Math.min(page, pageCount - 1);

  useEffect(() => {
    if (page !== clampedPage) setPage(clampedPage);
  }, [page, clampedPage]);

  const pageObservations = useMemo(
    () =>
      sortedObservations.slice(
        clampedPage * OBSERVATIONS_PER_PAGE,
        (clampedPage + 1) * OBSERVATIONS_PER_PAGE,
      ),
    [sortedObservations, clampedPage],
  );

  const data = useMemo<FlatRow[]>(() => {
    let groupCount = 0;
    let lastObservationId: string | null = null;
    return pageObservations.flatMap((observation) =>
      observation.species.map((species, speciesIndex) => {
        const isNewGroup = observation.id !== lastObservationId;
        if (isNewGroup) groupCount++;
        lastObservationId = observation.id;
        return {
          rowId: `${observation.id}-${speciesIndex}`,
          observation,
          species,
          speciesIndex,
          isNewGroup,
          groupParity: groupCount % 2,
        };
      }),
    );
  }, [pageObservations]);

  /** Text-style cell: shows plain text, and the very first click both enters edit mode and focuses the input (no second click needed). */
  const textCell = (
    cellKey: string,
    display: ReactNode,
    editControl: ReactNode,
  ) => {
    const isEditing = editingCell === cellKey;
    if (isEditing) {
      return editControl;
    }
    return (
      <button
        type="button"
        onClick={() => setEditingCell(cellKey)}
        className="w-full h-full text-left px-2 py-1.5 hover:bg-sand/60 dark:hover:bg-forest/60 transition-colors"
      >
        {display || <span className="text-slate">—</span>}
      </button>
    );
  };

  /** Dropdown/picker-style cell: the first click both enters edit mode and opens the popover immediately. */
  const pickerCell = (
    cellKey: string,
    display: ReactNode,
    renderControl: (opts: {
      defaultOpen: boolean;
      onOpenChange: (open: boolean) => void;
    }) => ReactNode,
  ) => {
    const isEditing = editingCell === cellKey;
    if (isEditing) {
      return renderControl({
        defaultOpen: true,
        onOpenChange: (open) => {
          if (!open) setEditingCell(null);
        },
      });
    }
    return (
      <button
        type="button"
        onClick={() => setEditingCell(cellKey)}
        className="w-full h-full text-left px-2 py-1.5 hover:bg-sand/60 dark:hover:bg-forest/60 transition-colors"
      >
        {display || <span className="text-slate">—</span>}
      </button>
    );
  };

  const toggleCell = (active: boolean | undefined, onToggle: () => void) => (
    <button
      type="button"
      onClick={onToggle}
      className="w-full h-full text-center px-2 py-1.5 hover:bg-sand/60 dark:hover:bg-forest/60 transition-colors"
    >
      {active ? "✕" : ""}
    </button>
  );

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "remove",
        header: "",
        size: 44,
        cell: ({ row }) => {
          const { observation, speciesIndex } = row.original;
          return (
            <button
              type="button"
              onClick={() => removeSpeciesRow(observation, speciesIndex)}
              className="w-full h-full flex items-center justify-center px-2 py-1.5 text-slate hover:text-rust transition-colors"
              aria-label="Fjern art"
            >
              <Trash2 size={14} />
            </button>
          );
        },
      }),
      columnHelper.display({
        id: "speciesName",
        header: "Artsnavn",
        size: 200,
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          return textCell(
            `${rowId}-speciesName`,
            species.species.PrefferedPopularname ??
              species.species.ValidScientificName,
            <AutoFocusInput
              defaultValue={
                species.species.PrefferedPopularname ??
                species.species.ValidScientificName ??
                ""
              }
              onBlur={(e) => {
                setSpeciesField(observation, speciesIndex, "species", {
                  ...species.species,
                  PrefferedPopularname: e.target.value,
                });
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "locationName",
        header: "Lokalitetsnavn",
        size: 180,
        cell: ({ row }) => {
          const { observation, rowId } = row.original;
          return textCell(
            `${rowId}-locationName`,
            observation.locationName,
            <AutoFocusInput
              defaultValue={observation.locationName || ""}
              onBlur={(e) => {
                setObservationField(
                  observation,
                  "locationName",
                  e.target.value,
                );
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "uncertaintyRadius",
        header: "Nøyaktighet",
        size: 130,
        cell: ({ row }) => {
          const { observation, rowId } = row.original;
          return textCell(
            `${rowId}-uncertaintyRadius`,
            observation.uncertaintyRadius
              ? `${observation.uncertaintyRadius} m`
              : "",
            <AutoFocusInput
              type="number"
              defaultValue={observation.uncertaintyRadius ?? ""}
              onBlur={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(parsed)) {
                  setObservationField(observation, "uncertaintyRadius", parsed);
                }
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "count",
        header: "Antall",
        size: 100,
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          return textCell(
            `${rowId}-count`,
            species.count,
            <AutoFocusInput
              type="number"
              min="1"
              defaultValue={species.count ?? ""}
              onBlur={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(parsed) && parsed >= 1) {
                  setSpeciesField(observation, speciesIndex, "count", parsed);
                }
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "unit",
        header: "Enhet",
        size: 150,
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          const taxonGroup = species.species.TaxonGroup || "";
          const cellKey = `${rowId}-unit`;
          return pickerCell(
            cellKey,
            species.unit,
            ({ defaultOpen, onOpenChange }) => (
              <Combobox
                variant="ghost"
                defaultOpen={defaultOpen}
                onOpenChange={onOpenChange}
                value={species.unit || ""}
                onChange={(v) =>
                  setSpeciesField(observation, speciesIndex, "unit", v)
                }
                options={
                  getUnitOptionsForTaxonGroup(taxonGroup) as ComboboxOption[]
                }
              />
            ),
          );
        },
      }),
      columnHelper.display({
        id: "gender",
        header: "Kjønn",
        size: 150,
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          const taxonGroup = species.species.TaxonGroup || "";
          const cellKey = `${rowId}-gender`;
          return pickerCell(
            cellKey,
            species.gender,
            ({ defaultOpen, onOpenChange }) => (
              <Combobox
                variant="ghost"
                defaultOpen={defaultOpen}
                onOpenChange={onOpenChange}
                value={species.gender || ""}
                onChange={(v) =>
                  setSpeciesField(observation, speciesIndex, "gender", v)
                }
                options={
                  getGenderOptionsForTaxonGroup(taxonGroup) as ComboboxOption[]
                }
              />
            ),
          );
        },
      }),
      columnHelper.display({
        id: "age",
        header: "Alder",
        size: 150,
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          const taxonGroup = species.species.TaxonGroup || "";
          const cellKey = `${rowId}-age`;
          return pickerCell(
            cellKey,
            species.age,
            ({ defaultOpen, onOpenChange }) => (
              <Combobox
                variant="ghost"
                defaultOpen={defaultOpen}
                onOpenChange={onOpenChange}
                value={species.age || ""}
                onChange={(v) =>
                  setSpeciesField(observation, speciesIndex, "age", v)
                }
                options={
                  getAgeOptionsForTaxonGroup(taxonGroup) as ComboboxOption[]
                }
              />
            ),
          );
        },
      }),
      columnHelper.display({
        id: "method",
        header: "Metode",
        size: 180,
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          const taxonGroup = species.species.TaxonGroup || "";
          const cellKey = `${rowId}-method`;
          return pickerCell(
            cellKey,
            species.method,
            ({ defaultOpen, onOpenChange }) => (
              <Combobox
                variant="ghost"
                defaultOpen={defaultOpen}
                onOpenChange={onOpenChange}
                value={species.method || ""}
                onChange={(v) =>
                  setSpeciesField(observation, speciesIndex, "method", v)
                }
                options={
                  getMethodOptionsForTaxonGroup(taxonGroup) as ComboboxOption[]
                }
              />
            ),
          );
        },
      }),
      columnHelper.display({
        id: "activity",
        header: "Aktivitet",
        size: 180,
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          const taxonGroup = species.species.TaxonGroup || "";
          const cellKey = `${rowId}-activity`;
          return pickerCell(
            cellKey,
            species.activity,
            ({ defaultOpen, onOpenChange }) => (
              <Combobox
                variant="ghost"
                defaultOpen={defaultOpen}
                onOpenChange={onOpenChange}
                value={species.activity || ""}
                onChange={(v) =>
                  setSpeciesField(observation, speciesIndex, "activity", v)
                }
                options={
                  getActivityOptionsForTaxonGroup(
                    taxonGroup,
                  ) as ComboboxOption[]
                }
              />
            ),
          );
        },
      }),
      columnHelper.display({
        id: "startDateDate",
        header: "Fra dato",
        size: 140,
        cell: ({ row }) => {
          const { observation, rowId } = row.original;
          const cellKey = `${rowId}-startDateDate`;
          return pickerCell(
            cellKey,
            formatDate(observation.startDate),
            ({ defaultOpen, onOpenChange }) => (
              <DatePicker
                variant="ghost"
                defaultOpen={defaultOpen}
                onOpenChange={onOpenChange}
                value={dayjs(observation.startDate)}
                onChange={(v) => {
                  if (!v) return;
                  const base = dayjs(observation.startDate);
                  setObservationField(
                    observation,
                    "startDate",
                    base
                      .year(v.year())
                      .month(v.month())
                      .date(v.date())
                      .toISOString(),
                  );
                }}
              />
            ),
          );
        },
      }),
      columnHelper.display({
        id: "startDateTime",
        header: "Fra klokkeslett",
        size: 130,
        cell: ({ row }) => {
          const { observation, rowId } = row.original;
          return textCell(
            `${rowId}-startDateTime`,
            formatTime(observation.startDate),
            <TimePicker
              variant="ghost"
              autoOpen
              value={dayjs(observation.startDate)}
              onChange={(hour, minute) => {
                setObservationField(
                  observation,
                  "startDate",
                  dayjs(observation.startDate)
                    .hour(hour)
                    .minute(minute)
                    .second(0)
                    .toISOString(),
                );
                setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "endDateDate",
        header: "Til dato",
        size: 140,
        cell: ({ row }) => {
          const { observation, rowId } = row.original;
          const cellKey = `${rowId}-endDateDate`;
          return pickerCell(
            cellKey,
            formatDate(observation.endDate),
            ({ defaultOpen, onOpenChange }) => (
              <DatePicker
                variant="ghost"
                defaultOpen={defaultOpen}
                onOpenChange={onOpenChange}
                value={observation.endDate ? dayjs(observation.endDate) : null}
                onClear={() => {
                  setObservationField(observation, "endDate", undefined);
                  setEditingCell(null);
                }}
                onChange={(v) => {
                  if (!v) return;
                  const base = observation.endDate
                    ? dayjs(observation.endDate)
                    : dayjs(observation.startDate);
                  setObservationField(
                    observation,
                    "endDate",
                    base
                      .year(v.year())
                      .month(v.month())
                      .date(v.date())
                      .toISOString(),
                  );
                }}
              />
            ),
          );
        },
      }),
      columnHelper.display({
        id: "endDateTime",
        header: "Til klokkeslett",
        size: 130,
        cell: ({ row }) => {
          const { observation, rowId } = row.original;
          return textCell(
            `${rowId}-endDateTime`,
            formatTime(observation.endDate),
            <TimePicker
              variant="ghost"
              autoOpen
              value={observation.endDate ? dayjs(observation.endDate) : null}
              onChange={(hour, minute) => {
                const base = observation.endDate
                  ? dayjs(observation.endDate)
                  : dayjs(observation.startDate);
                setObservationField(
                  observation,
                  "endDate",
                  base.hour(hour).minute(minute).second(0).toISOString(),
                );
                setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "speciesComment",
        header: "Kommentar",
        size: 220,
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          return textCell(
            `${rowId}-speciesComment`,
            species.comment,
            <AutoFocusTextarea
              rows={2}
              defaultValue={species.comment || ""}
              onBlur={(e) => {
                setSpeciesField(
                  observation,
                  speciesIndex,
                  "comment",
                  e.target.value,
                );
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "privateComment",
        header: "Privat kommentar",
        size: 220,
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          return textCell(
            `${rowId}-privateComment`,
            species.privateComment,
            <AutoFocusTextarea
              rows={2}
              defaultValue={species.privateComment || ""}
              onBlur={(e) => {
                setSpeciesField(
                  observation,
                  speciesIndex,
                  "privateComment",
                  e.target.value,
                );
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "observerName",
        header: "Medobservatør",
        size: 170,
        cell: ({ row }) => {
          const { observation, rowId } = row.original;
          return textCell(
            `${rowId}-observerName`,
            observation.observerName,
            <AutoFocusInput
              defaultValue={observation.observerName || ""}
              onBlur={(e) => {
                setObservationField(
                  observation,
                  "observerName",
                  e.target.value,
                );
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "project",
        header: "Prosjekt",
        size: 150,
        cell: ({ row }) => {
          const { observation, rowId } = row.original;
          return textCell(
            `${rowId}-project`,
            observation.project,
            <AutoFocusInput
              defaultValue={observation.project || ""}
              onBlur={(e) => {
                setObservationField(observation, "project", e.target.value);
                setEditingCell(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "notRediscovered",
        header: "Ikke gjenfunnet",
        size: 130,
        cell: ({ row }) => {
          const { observation, species, speciesIndex } = row.original;
          return toggleCell(species.notRediscovered, () =>
            setSpeciesField(
              observation,
              speciesIndex,
              "notRediscovered",
              !species.notRediscovered,
            ),
          );
        },
      }),
      columnHelper.display({
        id: "notFound",
        header: "Ikke funnet",
        size: 120,
        cell: ({ row }) => {
          const { observation, species, speciesIndex } = row.original;
          return toggleCell(species.notFound, () =>
            setSpeciesField(
              observation,
              speciesIndex,
              "notFound",
              !species.notFound,
            ),
          );
        },
      }),
      columnHelper.display({
        id: "secondHand",
        header: "Andrehånds",
        size: 120,
        cell: ({ row }) => {
          const { observation, species, speciesIndex } = row.original;
          return toggleCell(species.secondHand, () =>
            setSpeciesField(
              observation,
              speciesIndex,
              "secondHand",
              !species.secondHand,
            ),
          );
        },
      }),
      columnHelper.display({
        id: "uncertainIdentification",
        header: "Usikker artsbestemming",
        size: 160,
        cell: ({ row }) => {
          const { observation, species, speciesIndex } = row.original;
          return toggleCell(species.uncertainIdentification, () =>
            setSpeciesField(
              observation,
              speciesIndex,
              "uncertainIdentification",
              !species.uncertainIdentification,
            ),
          );
        },
      }),
      columnHelper.display({
        id: "hide",
        header: "Skjul",
        size: 100,
        cell: ({ row }) => {
          const { observation, species, speciesIndex } = row.original;
          return toggleCell(species.hide, () =>
            setSpeciesField(observation, speciesIndex, "hide", !species.hide),
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editingCell],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.rowId,
  });

  return (
    <div className="border-2 border-moss/40 rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="border-collapse table-fixed">
          <colgroup>
            {table.getFlatHeaders().map((header) => (
              <col key={header.id} style={{ width: header.getSize() }} />
            ))}
          </colgroup>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className={headerClass}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const { isNewGroup, groupParity } = row.original;
              return (
                <tr
                  key={row.id}
                  className={twMerge(
                    groupParity ? "bg-moss/5 dark:bg-moss/10" : "",
                    isNewGroup ? "border-t-2 border-moss/40" : "",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={cellClass}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-md px-md py-sm border-t-2 border-moss/40 bg-sand dark:bg-forest">
          <span className="text-xs text-slate">
            Observasjon {clampedPage * OBSERVATIONS_PER_PAGE + 1}–
            {Math.min(
              (clampedPage + 1) * OBSERVATIONS_PER_PAGE,
              sortedObservations.length,
            )}{" "}
            av {sortedObservations.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={clampedPage === 0}
              onClick={() => goToPage(Math.max(0, clampedPage - 1))}
              aria-label="Forrige side"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-xs text-bark dark:text-sand whitespace-nowrap">
              Side {clampedPage + 1} av {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={clampedPage >= pageCount - 1}
              onClick={() => goToPage(Math.min(pageCount - 1, clampedPage + 1))}
              aria-label="Neste side"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObservationsTable;
