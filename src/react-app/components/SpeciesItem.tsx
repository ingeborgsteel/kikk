import { Button } from "./ui/button.tsx";
import { X } from "lucide-react";
import { Label } from "./ui/label.tsx";
import { Combobox } from "./ui/combobox.tsx";
import { Input } from "./ui/input.tsx";
import { Textarea } from "./ui/textarea.tsx";
import { useMemo, useState } from "react";
import { Species } from "../types/observation.ts";
import { useObservations } from "../context/ObservationsContext.tsx";
import { getAgeOptionsForTaxonGroup } from "../lib/ageOptions.ts";
import { TAXON_GROUP_PICKER_OPTIONS } from "../lib/taxonGroups.ts";
import {
  getActivityOptionsForTaxonGroup,
  getTopActivitiesForTaxonGroup,
} from "../lib/activityOptions.ts";
import {
  getMethodOptionsForTaxonGroup,
  getTopMethodsForTaxonGroup,
} from "../lib/methodOptions.ts";
import { getGenderOptionsForTaxonGroup } from "../lib/genderOptions.ts";
import { getUnitOptionsForTaxonGroup } from "../lib/unitOptions.ts";
import { DatePicker } from "./ui/date-picker.tsx";
import dayjs from "dayjs";

interface SpeciesItemProps {
  species: Species;
  updateSpecies: (
    field: keyof Species,
    value?: string | number | boolean,
  ) => void;
  updateTaxonGroup: (taxonGroup: string) => void;
  removeSpecies: () => void;
  key: number;
}

const SpeciesItem = ({
  species,
  updateSpecies,
  updateTaxonGroup,
  removeSpecies,
  key,
}: SpeciesItemProps) => {
  const { observations } = useObservations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [countInput, setCountInput] = useState(String(species.count));

  const ageOptions = useMemo(
    () => getAgeOptionsForTaxonGroup(species.species.TaxonGroup || ""),
    [species.species.TaxonGroup],
  );

  const activityOptions = useMemo(
    () => getActivityOptionsForTaxonGroup(species.species.TaxonGroup || ""),
    [species.species.TaxonGroup],
  );

  const topActivities = useMemo(
    () =>
      getTopActivitiesForTaxonGroup(
        observations,
        species.species.TaxonGroup || "",
      ),
    [observations, species.species.TaxonGroup],
  );

  const methodOptions = useMemo(
    () => getMethodOptionsForTaxonGroup(species.species.TaxonGroup || ""),
    [species.species.TaxonGroup],
  );

  const topMethods = useMemo(
    () =>
      getTopMethodsForTaxonGroup(
        observations,
        species.species.TaxonGroup || "",
      ),
    [observations, species.species.TaxonGroup],
  );

  const genderOptions = useMemo(
    () => getGenderOptionsForTaxonGroup(species.species.TaxonGroup || ""),
    [species.species.TaxonGroup],
  );

  const taxonGroup = (species.species.TaxonGroup || "").toLowerCase().trim();
  const showUnit = taxonGroup !== "fugler";
  const showActivity = ![
    "karplanter",
    "moser",
    "bladmoser",
    "levermoser",
    "sopper",
    "storsopper",
    "småsopper",
    "laver",
    "lav",
  ].includes(taxonGroup);
  const showMethod = showActivity && showUnit;

  const unitOptions = useMemo(
    () => getUnitOptionsForTaxonGroup(species.species.TaxonGroup || ""),
    [species.species.TaxonGroup],
  );

  return (
    <div className="bg-white dark:bg-forest rounded-md border-2 border-moss transition-colors">
      <div
        className="flex items-center justify-between p-sm cursor-pointer hover:bg-moss/10 dark:hover:bg-sand/10"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium text-bark dark:text-sand truncate">
            {species.species.PrefferedPopularname ??
              species.species.ValidScientificName}
          </div>
        </div>
        <div className="flex items-center gap-sm ml-sm shrink-0">
          <Button
            variant="accent"
            size={"icon"}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              removeSpecies();
            }}
            aria-label="Remove species"
            className="shrink-0"
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-md pb-md space-y-sm border-t border-moss/30">
          <div className="pt-sm">
            {species.species.ValidScientificName && (
              <div className="text-sm text-slate italic">
                {species.species.ValidScientificName}
              </div>
            )}
            <div className="mt-1">
              <Label
                htmlFor={`taxon-group-${key}`}
                className="text-bark dark:text-sand text-xs"
              >
                Artsgruppe
              </Label>
              <Combobox
                id={`taxon-group-${key}`}
                value={taxonGroup}
                onChange={(v) => updateTaxonGroup(v.toLowerCase().trim())}
                options={TAXON_GROUP_PICKER_OPTIONS}
                placeholder="—"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-sm">
            <div>
              <Label
                htmlFor={`gender-${key}`}
                className="text-bark dark:text-sand text-xs"
              >
                Kjønn
              </Label>
              <Combobox
                id={`gender-${key}`}
                value={species.gender || ""}
                onChange={(v) => updateSpecies("gender", v)}
                options={genderOptions}
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor={`age-${key}`}
                className="text-bark dark:text-sand text-xs"
              >
                Alder
              </Label>
              <Combobox
                id={`age-${key}`}
                value={species.age || ""}
                onChange={(v) => updateSpecies("age", v)}
                options={ageOptions}
                className="mt-1"
              />
            </div>
          </div>

          <div
            className={`grid gap-sm ${showUnit ? "grid-cols-2" : "grid-cols-1"}`}
          >
            <div>
              <Label
                htmlFor={`count-${key}`}
                className="text-bark dark:text-sand text-xs"
              >
                Antall
              </Label>
              <Input
                id={`count-${key}`}
                type="number"
                min="1"
                value={countInput}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setCountInput(nextValue);

                  if (nextValue === "") {
                    return;
                  }

                  const parsedValue = Number.parseInt(nextValue, 10);
                  if (!Number.isNaN(parsedValue) && parsedValue >= 1) {
                    updateSpecies("count", parsedValue);
                  }
                }}
                className="mt-1"
              />
            </div>
            {showUnit && (
              <div>
                <Label
                  htmlFor={`unit-${key}`}
                  className="text-bark dark:text-sand text-xs"
                >
                  Enhet
                </Label>
                <Combobox
                  id={`unit-${key}`}
                  value={species.unit || ""}
                  onChange={(v) => updateSpecies("unit", v)}
                  options={unitOptions}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <div
            className={`grid gap-sm ${showActivity && showMethod ? "grid-cols-2" : "grid-cols-1"}`}
          >
            {showMethod && (
              <div>
                <Label
                  htmlFor={`method-${key}`}
                  className="text-bark dark:text-sand text-xs"
                >
                  Metode
                </Label>
                <Combobox
                  id={`method-${key}`}
                  value={species.method || ""}
                  onChange={(v) => updateSpecies("method", v)}
                  options={
                    topMethods.length > 0
                      ? [
                          ...topMethods.map((opt) => ({
                            ...opt,
                            group: "Mest brukt",
                          })),
                          ...methodOptions.map((opt) => ({
                            ...opt,
                            group: "Alle",
                          })),
                        ]
                      : methodOptions
                  }
                  className="mt-1"
                />
              </div>
            )}
            {showActivity && (
              <div>
                <Label
                  htmlFor={`activity-${key}`}
                  className="text-bark dark:text-sand text-xs"
                >
                  Aktivitet
                </Label>
                <Combobox
                  id={`activity-${key}`}
                  value={species.activity || ""}
                  onChange={(v) => updateSpecies("activity", v)}
                  options={
                    topActivities.length > 0
                      ? [
                          ...topActivities.map((opt) => ({
                            ...opt,
                            group: "Mest brukt",
                          })),
                          ...activityOptions.map((opt) => ({
                            ...opt,
                            group: "Alle",
                          })),
                        ]
                      : activityOptions
                  }
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <div>
            <Label
              htmlFor={`species-comment-${key}`}
              className="text-bark dark:text-sand text-xs"
            >
              Notat (synlig for alle)
            </Label>
            <Textarea
              id={`species-comment-${key}`}
              placeholder="Notater om denne spesifikke observasjonen..."
              value={species.comment}
              onChange={(e) => updateSpecies("comment", e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>

          <div>
            <Label
              htmlFor={`private-comment-${key}`}
              className="text-bark dark:text-sand text-xs"
            >
              Privat kommentar
            </Label>
            <Textarea
              id={`private-comment-${key}`}
              placeholder="Private notater..."
              value={species.privateComment || ""}
              onChange={(e) => updateSpecies("privateComment", e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>

          <div>
            <Label
              htmlFor={`private-collection-${key}`}
              className="text-bark dark:text-sand text-xs"
            >
              Privat samling
            </Label>
            <Input
              id={`private-collection-${key}`}
              type="text"
              placeholder="Navn på samlingseier"
              value={species.privateCollection || ""}
              onChange={(e) =>
                updateSpecies("privateCollection", e.target.value)
              }
              className="mt-1"
            />
          </div>

          <div className="flex flex-wrap gap-sm">
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={species.notRediscovered || false}
                onChange={(e) =>
                  updateSpecies("notRediscovered", e.target.checked)
                }
                className="w-4 h-4"
              />
              <span className="text-xs text-bark dark:text-sand">
                Ikke gjenfunnet
              </span>
            </label>
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={species.notFound || false}
                onChange={(e) => updateSpecies("notFound", e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs text-bark dark:text-sand">
                Ikke funnet
              </span>
            </label>
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={species.secondHand || false}
                onChange={(e) => updateSpecies("secondHand", e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs text-bark dark:text-sand">
                Andrehånds
              </span>
            </label>
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={species.uncertainIdentification || false}
                onChange={(e) =>
                  updateSpecies("uncertainIdentification", e.target.checked)
                }
                className="w-4 h-4"
              />
              <span className="text-xs text-bark dark:text-sand">
                Usikker artsbestemming
              </span>
            </label>
            <label className="flex items-center gap-sm cursor-pointer">
              <input
                type="checkbox"
                checked={species.hide || false}
                onChange={(e) => updateSpecies("hide", e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs text-bark dark:text-sand">
                Skjul fra Artsobservasjoner
              </span>
            </label>
          </div>

          <div>
            <Label
              htmlFor={`delay-publication-${key}`}
              className="text-bark dark:text-sand text-xs"
            >
              Utsett publisering til
            </Label>
            <div className="mt-1">
              <DatePicker
                id={`delay-publication-${key}`}
                value={
                  species.delayPublication
                    ? dayjs(species.delayPublication)
                    : null
                }
                onChange={(newValue) =>
                  updateSpecies(
                    "delayPublication",
                    newValue ? newValue.toISOString() : undefined,
                  )
                }
                onClear={() => updateSpecies("delayPublication", undefined)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeciesItem;
