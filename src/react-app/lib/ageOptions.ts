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
const UNKNOWN: AgeOption = { value: "", label: "Ikke angitt" };

const BIRD_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "egg", label: "Egg" },
  { value: "pullus", label: "Pullus (dununge)" },
  { value: "juvenile", label: "Juvenil" },
  { value: "immature", label: "Immatur" },
  { value: "subadult", label: "Subadult" },
  { value: "adult", label: "Voksen" },
];

const MAMMAL_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "juvenile", label: "Juvenil" },
  { value: "subadult", label: "Subadult" },
  { value: "adult", label: "Voksen" },
];

const AMPHIBIAN_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "egg", label: "Egg/rogn" },
  { value: "larva", label: "Larve (rumpetroll)" },
  { value: "juvenile", label: "Juvenil" },
  { value: "adult", label: "Voksen" },
];

const REPTILE_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "egg", label: "Egg" },
  { value: "juvenile", label: "Juvenil" },
  { value: "subadult", label: "Subadult" },
  { value: "adult", label: "Voksen" },
];

const FISH_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "egg", label: "Egg/rogn" },
  { value: "larva", label: "Yngel" },
  { value: "juvenile", label: "Juvenil" },
  { value: "adult", label: "Voksen" },
];

const INSECT_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "egg", label: "Egg" },
  { value: "larva", label: "Larve" },
  { value: "pupa", label: "Puppe" },
  { value: "imago", label: "Imago (voksen)" },
];

const PLANT_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "seed", label: "Frø" },
  { value: "seedling", label: "Spire" },
  { value: "vegetative", label: "Vegetativ" },
  { value: "flowering", label: "Blomstrende" },
  { value: "fruiting", label: "Fruktbærende" },
];

const MOSS_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "vegetative", label: "Vegetativ" },
  { value: "sporophyte", label: "Med sporofytt" },
];

const FUNGI_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "mycelium", label: "Mycel" },
  { value: "fruiting_body", label: "Fruktlegeme" },
];

const LICHEN_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "vegetative", label: "Vegetativ" },
  { value: "fertile", label: "Fertil (med apothecier)" },
];

/** Default options for taxon groups without specific mappings */
const DEFAULT_OPTIONS: AgeOption[] = [
  UNKNOWN,
  { value: "juvenile", label: "Juvenil" },
  { value: "adult", label: "Voksen" },
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
