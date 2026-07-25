import { ReactNode, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import dayjs from "dayjs";
import { Trash2 } from "lucide-react";
import { Observation, Species } from "../types/observation.ts";
import { useObservations } from "../context/ObservationsContext.tsx";
import { Input } from "./ui/input.tsx";
import { Textarea } from "./ui/textarea.tsx";
import { Combobox, ComboboxOption } from "./ui/combobox.tsx";
import { DatePicker } from "./ui/date-picker.tsx";
import { TimePicker } from "./ui/time-picker.tsx";
import { getAgeOptionsForTaxonGroup } from "../lib/ageOptions.ts";
import { getGenderOptionsForTaxonGroup } from "../lib/genderOptions.ts";
import { getUnitOptionsForTaxonGroup } from "../lib/unitOptions.ts";
import { getMethodOptionsForTaxonGroup } from "../lib/methodOptions.ts";
import { getActivityOptionsForTaxonGroup } from "../lib/activityOptions.ts";
import { twMerge } from "tailwind-merge";

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
  "px-2 py-1.5 text-sm text-bark dark:text-sand whitespace-nowrap align-middle";
const headerClass =
  "px-2 py-2 text-left text-xs font-semibold text-bark dark:text-sand whitespace-nowrap sticky top-0 bg-sand dark:bg-forest z-10 border-b-2 border-moss";

const formatDate = (value?: string) =>
  value && dayjs(value).isValid() ? dayjs(value).format("DD.MM.YYYY") : "";
const formatTime = (value?: string) =>
  value && dayjs(value).isValid() ? dayjs(value).format("HH:mm") : "";

const columnHelper = createColumnHelper<FlatRow>();

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

  const data = useMemo<FlatRow[]>(() => {
    const sorted = [...observations].sort((a, b) =>
      dayjs(b.startDate).diff(dayjs(a.startDate)),
    );
    let groupCount = 0;
    let lastObservationId: string | null = null;
    return sorted.flatMap((observation) =>
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
  }, [observations]);

  const editableCell = (
    cellKey: string,
    display: ReactNode,
    editControl: ReactNode,
  ) => {
    const isEditing = editingCell === cellKey;
    return (
      <div
        className="cursor-pointer min-h-5"
        onClick={() => !isEditing && setEditingCell(cellKey)}
      >
        {isEditing ? (
          editControl
        ) : display ? (
          display
        ) : (
          <span className="text-slate">—</span>
        )}
      </div>
    );
  };

  const toggleCell = (active: boolean | undefined, onToggle: () => void) => (
    <div className="cursor-pointer text-center" onClick={onToggle}>
      {active ? "✕" : ""}
    </div>
  );

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "remove",
        header: "",
        cell: ({ row }) => {
          const { observation, speciesIndex } = row.original;
          return (
            <button
              type="button"
              onClick={() => removeSpeciesRow(observation, speciesIndex)}
              className="text-slate hover:text-rust transition-colors"
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
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          return editableCell(
            `${rowId}-speciesName`,
            species.species.PrefferedPopularname ??
              species.species.ValidScientificName,
            <Input
              autoFocus
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
            />,
          );
        },
      }),
      columnHelper.display({
        id: "locationName",
        header: "Lokalitetsnavn",
        cell: ({ row }) => {
          const { observation, rowId } = row.original;
          return editableCell(
            `${rowId}-locationName`,
            observation.locationName,
            <Input
              autoFocus
              defaultValue={observation.locationName || ""}
              onBlur={(e) => {
                setObservationField(observation, "locationName", e.target.value);
                setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "uncertaintyRadius",
        header: "Nøyaktighet",
        cell: ({ row }) => {
          const { observation, rowId } = row.original;
          return editableCell(
            `${rowId}-uncertaintyRadius`,
            observation.uncertaintyRadius
              ? `${observation.uncertaintyRadius} m`
              : "",
            <Input
              autoFocus
              type="number"
              defaultValue={observation.uncertaintyRadius ?? ""}
              onBlur={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(parsed)) {
                  setObservationField(observation, "uncertaintyRadius", parsed);
                }
                setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "count",
        header: "Antall",
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          return editableCell(
            `${rowId}-count`,
            species.count,
            <Input
              autoFocus
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
            />,
          );
        },
      }),
      columnHelper.display({
        id: "unit",
        header: "Enhet",
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          const taxonGroup = species.species.TaxonGroup || "";
          return editableCell(
            `${rowId}-unit`,
            species.unit,
            <Combobox
              value={species.unit || ""}
              onChange={(v) => {
                setSpeciesField(observation, speciesIndex, "unit", v);
                setEditingCell(null);
              }}
              options={
                getUnitOptionsForTaxonGroup(taxonGroup) as ComboboxOption[]
              }
            />,
          );
        },
      }),
      columnHelper.display({
        id: "gender",
        header: "Kjønn",
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          const taxonGroup = species.species.TaxonGroup || "";
          return editableCell(
            `${rowId}-gender`,
            species.gender,
            <Combobox
              value={species.gender || ""}
              onChange={(v) => {
                setSpeciesField(observation, speciesIndex, "gender", v);
                setEditingCell(null);
              }}
              options={
                getGenderOptionsForTaxonGroup(taxonGroup) as ComboboxOption[]
              }
            />,
          );
        },
      }),
      columnHelper.display({
        id: "age",
        header: "Alder",
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          const taxonGroup = species.species.TaxonGroup || "";
          return editableCell(
            `${rowId}-age`,
            species.age,
            <Combobox
              value={species.age || ""}
              onChange={(v) => {
                setSpeciesField(observation, speciesIndex, "age", v);
                setEditingCell(null);
              }}
              options={
                getAgeOptionsForTaxonGroup(taxonGroup) as ComboboxOption[]
              }
            />,
          );
        },
      }),
      columnHelper.display({
        id: "method",
        header: "Metode",
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          const taxonGroup = species.species.TaxonGroup || "";
          return editableCell(
            `${rowId}-method`,
            species.method,
            <Combobox
              value={species.method || ""}
              onChange={(v) => {
                setSpeciesField(observation, speciesIndex, "method", v);
                setEditingCell(null);
              }}
              options={
                getMethodOptionsForTaxonGroup(taxonGroup) as ComboboxOption[]
              }
            />,
          );
        },
      }),
      columnHelper.display({
        id: "activity",
        header: "Aktivitet",
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          const taxonGroup = species.species.TaxonGroup || "";
          return editableCell(
            `${rowId}-activity`,
            species.activity,
            <Combobox
              value={species.activity || ""}
              onChange={(v) => {
                setSpeciesField(observation, speciesIndex, "activity", v);
                setEditingCell(null);
              }}
              options={
                getActivityOptionsForTaxonGroup(taxonGroup) as ComboboxOption[]
              }
            />,
          );
        },
      }),
      columnHelper.display({
        id: "startDateDate",
        header: "Fra dato",
        cell: ({ row }) => {
          const { observation, rowId } = row.original;
          return editableCell(
            `${rowId}-startDateDate`,
            formatDate(observation.startDate),
            <DatePicker
              value={dayjs(observation.startDate)}
              onChange={(v) => {
                if (!v) return;
                const base = dayjs(observation.startDate);
                setObservationField(
                  observation,
                  "startDate",
                  base.year(v.year()).month(v.month()).date(v.date()).toISOString(),
                );
                setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "startDateTime",
        header: "Fra klokkeslett",
        cell: ({ row }) => {
          const { observation, rowId } = row.original;
          return editableCell(
            `${rowId}-startDateTime`,
            formatTime(observation.startDate),
            <TimePicker
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
        cell: ({ row }) => {
          const { observation, rowId } = row.original;
          return editableCell(
            `${rowId}-endDateDate`,
            formatDate(observation.endDate),
            <DatePicker
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
                  base.year(v.year()).month(v.month()).date(v.date()).toISOString(),
                );
                setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "endDateTime",
        header: "Til klokkeslett",
        cell: ({ row }) => {
          const { observation, rowId } = row.original;
          return editableCell(
            `${rowId}-endDateTime`,
            formatTime(observation.endDate),
            <TimePicker
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
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          return editableCell(
            `${rowId}-speciesComment`,
            species.comment,
            <Textarea
              autoFocus
              rows={2}
              defaultValue={species.comment || ""}
              onBlur={(e) => {
                setSpeciesField(observation, speciesIndex, "comment", e.target.value);
                setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "privateComment",
        header: "Privat kommentar",
        cell: ({ row }) => {
          const { observation, species, speciesIndex, rowId } = row.original;
          return editableCell(
            `${rowId}-privateComment`,
            species.privateComment,
            <Textarea
              autoFocus
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
            />,
          );
        },
      }),
      columnHelper.display({
        id: "observerName",
        header: "Medobservatør",
        cell: ({ row }) => {
          const { observation, rowId } = row.original;
          return editableCell(
            `${rowId}-observerName`,
            observation.observerName,
            <Input
              autoFocus
              defaultValue={observation.observerName || ""}
              onBlur={(e) => {
                setObservationField(observation, "observerName", e.target.value);
                setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "project",
        header: "Prosjekt",
        cell: ({ row }) => {
          const { observation, rowId } = row.original;
          return editableCell(
            `${rowId}-project`,
            observation.project,
            <Input
              autoFocus
              defaultValue={observation.project || ""}
              onBlur={(e) => {
                setObservationField(observation, "project", e.target.value);
                setEditingCell(null);
              }}
            />,
          );
        },
      }),
      columnHelper.display({
        id: "notRediscovered",
        header: "Ikke gjenfunnet",
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
    <div className="overflow-x-auto border-2 border-moss/40 rounded-md">
      <table className="border-collapse w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className={headerClass}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ObservationsTable;
