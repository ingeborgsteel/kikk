export interface UnitOption {
  value: string;
  label: string;
}

const UNKNOWN: UnitOption = { value: "", label: "" };

const o = (v: string): UnitOption => ({ value: v, label: v });

const ALGAE_OPTIONS: UnitOption[] = [
  UNKNOWN,
  o("Planter"),
  o("Skudd/stilker/strå"),
  o("Tuer"),
  o("Thalli"),
  o("m2"),
  o("dm2"),
  o("cm2"),
];

const AMPHIBIAN_REPTILE_OPTIONS: UnitOption[] = [
  UNKNOWN,
  o("Individer"),
  o("Eggklumper"),
];

const FISH_OPTIONS: UnitOption[] = [
  UNKNOWN,
  o("Individer"),
  o("Lekegroper"),
  o("Eggklumper"),
];

const PLANT_OPTIONS: UnitOption[] = [
  UNKNOWN,
  o("Planter"),
  o("Tuer"),
  o("Skudd/stilker/strå"),
  o("Busker"),
  o("Trær"),
  o("m2"),
  o("dm2"),
  o("cm2"),
];

const LICHEN_OPTIONS: UnitOption[] = [
  UNKNOWN,
  o("Thalli"),
  o("Kolonier"),
  o("m2"),
  o("dm2"),
  o("cm2"),
];

const MOSS_OPTIONS: UnitOption[] = [
  UNKNOWN,
  o("Tuer"),
  o("Kapsler"),
  o("Planter"),
  o("m2"),
  o("dm2"),
  o("cm2"),
];

const FUNGI_OPTIONS: UnitOption[] = [
  UNKNOWN,
  o("Fruktlegemer"),
  o("Mycel"),
  o("m2"),
  o("dm2"),
  o("cm2"),
];

const INVERTEBRATE_OPTIONS: UnitOption[] = [
  UNKNOWN,
  o("Individer"),
  o("Eggklumper"),
  o("Kolonier"),
];

const MAMMAL_OPTIONS: UnitOption[] = [
  UNKNOWN,
  o("Individer"),
  o("Bol/hi"),
  o("Kolonier"),
  o("Flaggermuskasse"),
];

import { TaxonGroupKey } from "./taxonGroups.ts";

const DEFAULT_OPTIONS: UnitOption[] = [UNKNOWN];

const TAXON_GROUP_UNIT_MAP: Partial<Record<TaxonGroupKey, UnitOption[]>> = {
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
  sopper: FUNGI_OPTIONS,
  storsopper: FUNGI_OPTIONS,
  småsopper: FUNGI_OPTIONS,
  laver: LICHEN_OPTIONS,
  lav: LICHEN_OPTIONS,
  alger: ALGAE_OPTIONS,
  makroalger: ALGAE_OPTIONS,
};

export function getUnitOptionsForTaxonGroup(taxonGroup: string): UnitOption[] {
  const key = taxonGroup.toLowerCase().trim() as TaxonGroupKey;
  return TAXON_GROUP_UNIT_MAP[key] ?? DEFAULT_OPTIONS;
}
