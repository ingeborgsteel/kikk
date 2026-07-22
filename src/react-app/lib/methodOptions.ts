export interface MethodOption {
  value: string;
  label: string;
}

const UNKNOWN: MethodOption = { value: "", label: "" };

const o = (v: string): MethodOption => ({ value: v, label: v });

const ALGAE_OPTIONS: MethodOption[] = [
  UNKNOWN,
  o("Observasjon"),
  o("Kasterive"),
  o("Bunnskrape"),
  o("Dykking"),
];

const AMPHIBIAN_REPTILE_OPTIONS: MethodOption[] = [
  UNKNOWN,
  o("Observasjon"),
  o("Vannhåv"),
  o("Håndplukk"),
  o("Hørt"),
  o("Felle"),
  o("Lys/lysfelle"),
  o("Nattkikkert"),
  o("Viltkamera"),
  o("Radiometri"),
];

const FISH_OPTIONS: MethodOption[] = [
  UNKNOWN,
  o("Observasjon"),
  o("Bunnskrape"),
  o("Dorging"),
  o("Drivgarn"),
  o("Dykking"),
  o("Elfiske"),
  o("Fluefiske"),
  o("Garnfiske"),
  o("Helgolandruse"),
  o("Isfiske"),
  o("Linefiske"),
  o("Meite"),
  o("Not"),
  o("Pilkfiske"),
  o("Ruse/teine"),
  o("Spinnerfiske"),
  o("Tråling"),
  o("Vannhåv"),
  o("Wobbler"),
  o("Sportsfiske"),
  o("Fiske"),
  o("Viltkamera"),
];

const INVERTEBRATE_OPTIONS: MethodOption[] = [
  UNKNOWN,
  o("Observasjon"),
  o("Håving"),
  o("Håndplukk"),
  o("Lys/lysfelle"),
  o("Banking av vegetasjon"),
  o("Fallfelle"),
  o("Sålding"),
  o("Foring/klekking"),
  o("Fargefelle"),
  o("Malaisefelle"),
  o("Vindusfelle"),
  o("Felle"),
  o("Åte/lokking"),
  o("Ultralyddetektor"),
  o("Ultralyddetektor og observasjon"),
  o("Viltkamera"),
  o("Limfelle"),
  o("Sugesamler"),
  o("Bunnhenter"),
  o("Bunnskrape"),
  o("Kasterive"),
  o("Dykking"),
  o("Garnfiske"),
  o("Linefiske"),
  o("Ruse/teine"),
  o("Surberprøvetaker"),
  o("Tråling"),
  o("Fiske"),
];

const MAMMAL_OPTIONS: MethodOption[] = [
  UNKNOWN,
  o("Observasjon"),
  o("Felle"),
  o("Garnfiske"),
  o("Hydrofon"),
  o("Hørt"),
  o("Nattkikkert"),
  o("Radiometri"),
  o("Viltkamera"),
  o("Ultralyddetektor"),
  o("Ultralyddetektor og observasjon"),
  o("Observasjon i hånden"),
  o("Observasjon i søvn/dvale"),
  o("Mistnett"),
  o("Håving"),
  o("Artsvalg fra dataprogram"),
  o("Autobox"),
  o("Autobox med frekvensdeling"),
  o("Autobox med heterodyne"),
  o("Autobox med høyfrekvensopptak"),
  o("Autobox med tidsekspansjon"),
  o("Detektor med frekvensdeling"),
  o("Detektor med heterodyne"),
  o("Detektor med heterodyne og tidsekspansjon"),
  o("Detektor med høyfrekvensopptak"),
  o("Lydopptak"),
  o("Lydopptak og observasjon"),
  o("Transponder"),
];

const DEFAULT_OPTIONS: MethodOption[] = [UNKNOWN, o("Observasjon")];

const TAXON_GROUP_METHOD_MAP: Record<string, MethodOption[]> = {
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

  alger: ALGAE_OPTIONS,
  makroalger: ALGAE_OPTIONS,
};

export function getMethodOptionsForTaxonGroup(
  taxonGroup: string,
): MethodOption[] {
  const key = taxonGroup.toLowerCase().trim();
  return TAXON_GROUP_METHOD_MAP[key] ?? DEFAULT_OPTIONS;
}
