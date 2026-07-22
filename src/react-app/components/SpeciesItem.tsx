import { Button } from "./ui/button.tsx";
import { X } from "lucide-react";
import { Label } from "./ui/label.tsx";
import { Select } from "./ui/select.tsx";
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
import { getMethodOptionsForTaxonGroup } from "../lib/methodOptions.ts";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
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

  const genderOptions = [
    { value: "", label: "" },
    { value: "Hann", label: "Hann" },
    { value: "Hunn", label: "Hunn" },
    { value: "Hunnfarget", label: "Hunnfarget" },
    { value: "I par", label: "I par" },
    { value: "Arbeider", label: "Arbeider" },
  ];

  const currentAgeInOptions = ageOptions.some(
    (opt) => opt.value === (species.age || ""),
  );

  const currentActivityInOptions = activityOptions.some(
    (opt) => opt.value === (species.activity || ""),
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
    "lav",
  ].includes(taxonGroup);

  const currentMethodInOptions = methodOptions.some(
    (opt) => opt.value === (species.method || ""),
  );

  const currentGenderInOptions = genderOptions.some(
    (opt) => opt.value === (species.gender || ""),
  );

  return (
    <div className="bg-white dark:bg-forest rounded-md border-2 border-moss hover:bg-sand/50 dark:hover:bg-bark/50 transition-colors">
      <div
        className="flex items-center justify-between p-sm cursor-pointer"
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
              <Select
                id={`taxon-group-${key}`}
                value={taxonGroup}
                onChange={(e) => updateTaxonGroup(e.target.value.toLowerCase().trim())}
                className="mt-1"
              >
                <option value="">—</option>
                {taxonGroup && !TAXON_GROUP_PICKER_OPTIONS.some((o) => o.value === taxonGroup) && (
                  <option value={taxonGroup}>{taxonGroup}</option>
                )}
                {TAXON_GROUP_PICKER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
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
              <Select
                id={`gender-${key}`}
                value={species.gender}
                onChange={(e) => updateSpecies("gender", e.target.value)}
                className="mt-1"
              >
                {!currentGenderInOptions && species.gender && (
                  <option value={species.gender}>
                    {species.gender} (egendefinert)
                  </option>
                )}
                {genderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
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
          </div>

          {showUnit && (
            <div>
              <Label
                htmlFor={`unit-${key}`}
                className="text-bark dark:text-sand text-xs"
              >
                Enhet
              </Label>
              <Input
                id={`unit-${key}`}
                type="text"
                placeholder="f.eks. individer, par"
                value={species.unit || ""}
                onChange={(e) => updateSpecies("unit", e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          <div className={`grid gap-sm ${showActivity ? "grid-cols-3" : "grid-cols-2"}`}>
            <div>
              <Label
                htmlFor={`age-${key}`}
                className="text-bark dark:text-sand text-xs"
              >
                Alder
              </Label>
              <Select
                id={`age-${key}`}
                value={species.age || ""}
                onChange={(e) => updateSpecies("age", e.target.value)}
                className="mt-1"
              >
                {!currentAgeInOptions && species.age && (
                  <option value={species.age}>
                    {species.age} (egendefinert)
                  </option>
                )}
                {ageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label
                htmlFor={`method-${key}`}
                className="text-bark dark:text-sand text-xs"
              >
                Metode
              </Label>
              <Select
                id={`method-${key}`}
                value={species.method || ""}
                onChange={(e) => updateSpecies("method", e.target.value)}
                className="mt-1"
              >
                {!currentMethodInOptions && species.method && (
                  <option value={species.method}>
                    {species.method} (egendefinert)
                  </option>
                )}
                {methodOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
            {showActivity && (
              <div>
                <Label
                  htmlFor={`activity-${key}`}
                  className="text-bark dark:text-sand text-xs"
                >
                  Aktivitet
                </Label>
                <Select
                  id={`activity-${key}`}
                  value={species.activity || ""}
                  onChange={(e) => updateSpecies("activity", e.target.value)}
                  className="mt-1"
                >
                  {!currentActivityInOptions && species.activity && (
                    <option value={species.activity}>
                      {species.activity} (egendefinert)
                    </option>
                  )}
                  {topActivities.length > 0 && (
                    <optgroup label="Mest brukt">
                      {topActivities.map((opt) => (
                        <option key={`top-${opt.value}`} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {topActivities.length > 0 && (
                    <optgroup label="Alle">
                      {activityOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {topActivities.length === 0 &&
                    activityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                </Select>
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
            <DemoContainer components={["DatePicker"]}>
              <MobileDatePicker
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: {
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 10,
                        background: "white",
                        "& fieldset": { border: "none" },
                        "&:hover fieldset": { border: "none" },
                        "&.Mui-focused fieldset": { border: "none" },
                      },
                    },
                  },
                  field: { clearable: true },
                }}
                sx={{ background: "white" }}
                value={
                  species.delayPublication
                    ? dayjs(species.delayPublication)
                    : undefined
                }
                onChange={(newValue) =>
                  updateSpecies(
                    "delayPublication",
                    newValue ? newValue.toISOString() : undefined,
                  )
                }
              />
            </DemoContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeciesItem;
