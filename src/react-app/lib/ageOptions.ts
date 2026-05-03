/**
 * Age/life stage options per taxon group.
 *
 * Options are based on standard field terminology used in Norwegian biodiversity
 * monitoring and reporting, aligned with Artsdatabanken conventions and the
 * Darwin Core standard "lifeStage" vocabulary.
 *
 * References:
 * - Artsdatabanken field guide terminology (https://artsdatabanken.no)
 * - Darwin Core lifeStage (https://dwc.tdwg.org/terms/#dwc:lifeStage)
 * - NBIC (Norwegian Biodiversity Information Centre) reporting standards
 */

export interface AgeOption {
  value: string;
  label: string;
}

/** Shared "unknown" option included in every group */
const UNKNOWN: AgeOption = { value: "", label: "" };

const BIRD_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Egg", label: "Egg" },
  { value: "Pullus (dununge)", label: "Pullus (dununge)" },
  { value: "Juvenil", label: "Juvenil" },
  { value: "Immatur", label: "Immatur" },
  { value: "Subadult", label: "Subadult" },
  { value: "Voksen", label: "Voksen" },
];

const MAMMAL_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Juvenil", label: "Juvenil" },
  { value: "Subadult", label: "Subadult" },
  { value: "Voksen", label: "Voksen" },
];

const AMPHIBIAN_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Egg", label: "Egg/rogn" },
  { value: "Larve", label: "Larve (rumpetroll)" },
  { value: "Juvenil", label: "Juvenil" },
  { value: "Voksen", label: "Voksen" },
];

const REPTILE_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Egg", label: "Egg" },
  { value: "Juvenil", label: "Juvenil" },
  { value: "Subadult", label: "Subadult" },
  { value: "Voksen", label: "Voksen" },
];

const FISH_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Egg", label: "Egg/rogn" },
  { value: "Yngel", label: "Yngel" },
  { value: "Juvenil", label: "Juvenil" },
  { value: "Voksen", label: "Voksen" },
];

const INSECT_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Egg", label: "Egg" },
  { value: "Larve", label: "Larve" },
  { value: "Puppe", label: "Puppe" },
  { value: "Imago", label: "Imago (voksen)" },
];

const ARACHNID_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Egg", label: "Egg" },
  { value: "Nymfe", label: "Nymfe" },
  { value: "Voksen", label: "Voksen" },
];

const PLANT_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Frø", label: "Frø" },
  { value: "Spire", label: "Spire" },
  { value: "Vegetativ", label: "Vegetativ" },
  { value: "Blomstrende", label: "Blomstrende" },
  { value: "Fruktbærende", label: "Fruktbærende" },
];

const MOSS_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Vegetativ", label: "Vegetativ" },
  { value: "Sporofytt", label: "Med sporofytt" },
];

const FUNGI_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Mycel", label: "Mycel" },
  { value: "Fruktlegeme", label: "Fruktlegeme" },
];

const LICHEN_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Vegetativ", label: "Vegetativ" },
  { value: "Fertil (med apothecier)", label: "Fertil (med apothecier)" },
];

/** Default options for taxon groups without specific mappings */
const DEFAULT_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "Juvenil", label: "Juvenil" },
  { value: "Voksen", label: "Voksen" },
];

/**
 * Map from Artsdatabanken TaxonGroup values (Norwegian) to age/life stage options.
 *
 * The keys are lowercase versions of the TaxonGroup strings returned by the
 * Artsdatabanken API. Common groups include: "Fugler", "Pattedyr", "Amfibier",
 * "Reptiler", "Fisker", "Insekter", "Sommerfugler", "Biller", "Veps",
 * "Karplanter", "Moser", "Sopp", "Lav", etc.
 */
const TAXON_GROUP_AGE_MAP: Record<string, AgeOption[]> = {
  // Birds
  fugler: BIRD_OPTIONS,

  // Mammals
  pattedyr: MAMMAL_OPTIONS,

  // Amphibians
  amfibier: AMPHIBIAN_OPTIONS,

  // Reptiles
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
  edderkopper: ARACHNID_OPTIONS,
  midd: ARACHNID_OPTIONS,

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
