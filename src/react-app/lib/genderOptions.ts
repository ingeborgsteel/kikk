export interface GenderOption {
  value: string;
  label: string;
}

const UNKNOWN: GenderOption = { value: "", label: "" };

const o = (v: string): GenderOption => ({ value: v, label: v });

const BIRD_OPTIONS: GenderOption[] = [
  UNKNOWN,
  o("Hann"),
  o("Hunn"),
  o("Hunnfarget"),
  o("I par"),
];

const ALGAE_OPTIONS: GenderOption[] = [UNKNOWN, o("Hann"), o("Hunn")];

const AMPHIBIAN_REPTILE_OPTIONS: GenderOption[] = [
  UNKNOWN,
  o("Hann"),
  o("Hunn"),
  o("I par"),
];

const FISH_OPTIONS: GenderOption[] = [UNKNOWN, o("Hann"), o("Hunn")];

const PLANT_OPTIONS: GenderOption[] = [
  UNKNOWN,
  o("Hann"),
  o("Hunn"),
  o("Tvekjønnet"),
];

const MOSS_OPTIONS: GenderOption[] = [UNKNOWN, o("Hann"), o("Hunn")];

const INVERTEBRATE_OPTIONS: GenderOption[] = [
  UNKNOWN,
  o("Hann"),
  o("Hunn"),
  o("Tvekjønnet"),
  o("I par"),
  o("Arbeider"),
];

const MAMMAL_OPTIONS: GenderOption[] = [
  UNKNOWN,
  o("Hann"),
  o("Hunn"),
  o("I par"),
];

import { TaxonGroupKey } from "./taxonGroups.ts";

const DEFAULT_OPTIONS: GenderOption[] = [UNKNOWN];

const TAXON_GROUP_GENDER_MAP: Partial<Record<TaxonGroupKey, GenderOption[]>> =
  {
    fugler: BIRD_OPTIONS,
    pattedyr: MAMMAL_OPTIONS,
    amfibier: AMPHIBIAN_REPTILE_OPTIONS,
    reptiler: AMPHIBIAN_REPTILE_OPTIONS,
    fisker: FISH_OPTIONS,
    ferskvannsfisker: FISH_OPTIONS,
    saltvannsfisker: FISH_OPTIONS,
    rundmunner: FISH_OPTIONS,
    insekter: INVERTEBRATE_OPTIONS,
    sommerfugler: INVERTEBRATE_OPTIONS,
    biller: INVERTEBRATE_OPTIONS,
    tovinger: INVERTEBRATE_OPTIONS,
    veps: INVERTEBRATE_OPTIONS,
    rettvinger: INVERTEBRATE_OPTIONS,
    døgnfluer: INVERTEBRATE_OPTIONS,
    steinfluer: INVERTEBRATE_OPTIONS,
    vårfluer: INVERTEBRATE_OPTIONS,
    øyenstikkere: INVERTEBRATE_OPTIONS,
    nebbmunner: INVERTEBRATE_OPTIONS,
    edderkopper: INVERTEBRATE_OPTIONS,
    midd: INVERTEBRATE_OPTIONS,
    "døgnfluer, øyenstikkere, steinfluer, vårfluer": INVERTEBRATE_OPTIONS,
    karplanter: PLANT_OPTIONS,
    moser: MOSS_OPTIONS,
    bladmoser: MOSS_OPTIONS,
    levermoser: MOSS_OPTIONS,
    alger: ALGAE_OPTIONS,
    makroalger: ALGAE_OPTIONS,
  };

export function getGenderOptionsForTaxonGroup(
  taxonGroup: string,
): GenderOption[] {
  const key = taxonGroup.toLowerCase().trim() as TaxonGroupKey;
  return TAXON_GROUP_GENDER_MAP[key] ?? DEFAULT_OPTIONS;
}
