export const TAXON_GROUP_KEYS = [
  // Birds
  "fugler",

  // Mammals
  "pattedyr",

  // Amphibians & reptiles
  "amfibier",
  "reptiler",

  // Fish
  "fisker",
  "ferskvannsfisker",
  "saltvannsfisker",
  "rundmunner",

  // Insects & related arthropods
  "insekter",
  "sommerfugler",
  "biller",
  "tovinger",
  "veps",
  "rettvinger",
  "døgnfluer",
  "steinfluer",
  "vårfluer",
  "øyenstikkere",
  "nebbmunner",
  "edderkopper",
  "midd",
  "døgnfluer, øyenstikkere, steinfluer, vårfluer",

  // Vascular plants
  "karplanter",

  // Mosses
  "moser",
  "bladmoser",
  "levermoser",

  // Fungi
  "sopper",
  "storsopper",
  "småsopper",

  // Lichens
  "laver",
  "lav",

  // Algae
  "alger",
  "makroalger",
] as const;

export type TaxonGroupKey = (typeof TAXON_GROUP_KEYS)[number];

export const TAXON_GROUP_KEY_SET = new Set<string>(TAXON_GROUP_KEYS);

export function isKnownTaxonGroup(taxonGroup: string): boolean {
  return TAXON_GROUP_KEY_SET.has(taxonGroup.toLowerCase().trim());
}

/** The groups shown in the manual picker (top-level groups only) */
export const TAXON_GROUP_PICKER_OPTIONS: {
  value: TaxonGroupKey;
  label: string;
}[] = [
  { value: "fugler", label: "Fugler" },
  { value: "pattedyr", label: "Pattedyr" },
  { value: "amfibier", label: "Amfibier" },
  { value: "reptiler", label: "Reptiler" },
  { value: "fisker", label: "Fisker" },
  { value: "insekter", label: "Insekter" },
  { value: "sommerfugler", label: "Sommerfugler" },
  { value: "edderkopper", label: "Edderkopper" },
  { value: "karplanter", label: "Karplanter" },
  { value: "moser", label: "Moser" },
  { value: "sopper", label: "Sopper" },
  { value: "laver", label: "Laver" },
];
