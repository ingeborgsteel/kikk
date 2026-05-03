export interface AgeOption {
  value: string;
  label: string;
}

/** Shared "unknown" option included in every group */
const UNKNOWN: AgeOption = { value: "", label: "" };

const BIRD_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Egg", label: "Egg" },
  { value: "Pulli", label: "Pulli" },
  { value: "Voksen", label: "Voksen" },
  { value: "1K", label: "1K" },
  { value: "1K+", label: "1K+" },
  { value: "2K", label: "2K" },
  { value: "2K+", label: "2K+" },
  { value: "2K-", label: "2K-" },
  { value: "3K", label: "3K" },
  { value: "3K+", label: "3K+" },
  { value: "3K-", label: "3K-" },
  { value: "4K", label: "4K" },
  { value: "4K+", label: "4K+" },
  { value: "4K-", label: "4K-" },
  { value: "5K", label: "5K" },
  { value: "5K+", label: "5K+" },
  { value: "5K-", label: "5K-" },
  { value: "6K", label: "6K" },
  { value: "6K+", label: "6K+" },
  { value: "6K-", label: "6K-" },
  { value: "7K", label: "7K" },
  { value: "7K+", label: "7K+" },
  { value: "7K-", label: "7K-" },
];

const MAMMAL_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Årsunge", label: "Årsunge" },
  { value: "Fjorårsunge", label: "Fjorårsunge" },
  { value: "Voksen", label: "Voksen" },
];

const REPTILE_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Egg", label: "Egg" },
  { value: "Larve", label: "Larve" },
  { value: "Årsunge", label: "Årsunge" },
  { value: "Voksen", label: "Voksen" },
];

const FISH_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Egg", label: "Egg" },
  { value: "Årsunge", label: "Årsunge" },
  { value: "Fjorårsunge", label: "Fjorårsunge" },
  { value: "Voksen", label: "Voksen" },
];

const INSECT_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Egg", label: "Egg" },
  { value: "Larve/nymfe", label: "Larve/nymfe" },
  { value: "Puppe", label: "Puppe" },
  { value: "Ung", label: "Ung" },
  { value: "Voksen", label: "Voksen" },
  { value: "Imago/Voksen", label: "Imago/Voksen" },
];

const PLANT_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Hvilestadium", label: "Hvilestadium" },
  { value: "Knoppskyting", label: "Knoppskyting" },
  { value: "Fullt utviklede blad", label: "Fullt utviklede blad" },
  { value: "Blomsterknopper", label: "Blomsterknopper" },
  { value: "Blomstring", label: "Blomstring" },
  { value: "Avblomstret", label: "Avblomstret" },
  { value: "I frukt", label: "I frukt" },
  { value: "Frukt-/frøspredning", label: "Frukt-/frøspredning" },
  { value: "Gulnende løv/blad", label: "Gulnende løv/blad" },
  { value: "Bladfelling, visner", label: "Bladfelling, visner" },
  { value: "Vinterstander", label: "Vinterstander" },
];

const MOSS_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Med kapsel", label: "Med kapsel" },
  { value: "Uten kapsel", label: "Uten kapsel" },
  { value: "Med grokorn", label: "Med grokorn" },
];

const FUNGI_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Anamorf (imperfekt)", label: "Anamorf (imperfekt)" },
  { value: "Teleomorf (perfekt)", label: "Teleomorf (perfekt)" },
];

const LICHEN_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Med apothecier", label: "Med apothecier" },
  { value: "Med perithecier", label: "Med perithecier" },
  { value: "Med soral", label: "Med soral" },
  { value: "Med isidier", label: "Med isidier" },
  { value: "Med schistisidier", label: "Med schistisidier" },
];

/** Default options for taxon groups without a verified category mapping */
const DEFAULT_OPTIONS: AgeOption[] = [UNKNOWN, ...MAMMAL_OPTIONS];

const TAXON_GROUP_AGE_MAP: Record<string, AgeOption[]> = {
  // Birds
  fugler: BIRD_OPTIONS,

  // Mammals
  pattedyr: MAMMAL_OPTIONS,

  amfibier: REPTILE_OPTIONS,
  reptiler: REPTILE_OPTIONS,

  // Fish
  fisker: FISH_OPTIONS,
  ferskvannsfisker: FISH_OPTIONS,
  saltvannsfisker: FISH_OPTIONS,
  rundmunner: FISH_OPTIONS,

  // Insects and related arthropods
  insekter: INSECT_OPTIONS,
  sommerfugler: INSECT_OPTIONS,
  biller: INSECT_OPTIONS,
  tovinger: INSECT_OPTIONS,
  veps: INSECT_OPTIONS,
  rettvinger: INSECT_OPTIONS,
  døgnfluer: INSECT_OPTIONS,
  steinfluer: INSECT_OPTIONS,
  vårfluer: INSECT_OPTIONS,
  øyenstikkere: INSECT_OPTIONS,
  nebbmunner: INSECT_OPTIONS,
  edderkopper: INSECT_OPTIONS,
  midd: INSECT_OPTIONS,

  // Vascular plants
  karplanter: PLANT_OPTIONS,

  // Mosses
  moser: MOSS_OPTIONS,
  bladmoser: MOSS_OPTIONS,
  levermoser: MOSS_OPTIONS,

  // Fungi
  sopp: FUNGI_OPTIONS,
  storsopp: FUNGI_OPTIONS,
  småsopp: FUNGI_OPTIONS,

  // Lichens
  lav: LICHEN_OPTIONS,
};

/**
 * Get age/life stage options for a given TaxonGroup string.
 * Falls back to a generic default if the group is not specifically mapped.
 */
export function getAgeOptionsForTaxonGroup(taxonGroup: string): AgeOption[] {
  const key = taxonGroup.toLowerCase().trim();
  return TAXON_GROUP_AGE_MAP[key] ?? DEFAULT_OPTIONS;
}
