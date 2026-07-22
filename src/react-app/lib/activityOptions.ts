export interface ActivityOption {
  value: string;
  label: string;
}

const UNKNOWN: ActivityOption = { value: "", label: "" };

const o = (v: string): ActivityOption => ({ value: v, label: v });

const BIRD_OPTIONS: ActivityOption[] = [
  UNKNOWN,
  o("Reir med egg eller unger"),
  o("Reir, unger hørt"),
  o("Rugende"),
  o("Mat til unger"),
  o("Bar ekskrementpose"),
  o("Reir i bruk"),
  o("Besøker bebodd reir"),
  o("Unger utenfor reir, ikke utvokste"),
  o("Brukt reir"),
  o("Eggeskall"),
  o("Avledningsmanøver"),
  o("Mislykket hekking"),
  o("Reirbygging"),
  o("Rugeflekker"),
  o("Engstelig adferd, indikasjon på hekking"),
  o("Reirbesøk?"),
  o("Paring/kurtise på mulig hekkeplass"),
  o("Permanent revir"),
  o("Par i passende hekkebiotop"),
  o("Sang/spill i hekketid og passende hekkebiotop"),
  o("Observasjon i hekketid, passende biotop"),
  o("Rastende"),
  o("Stasjonær"),
  o("Overflygende"),
  o("Næringssøkende"),
  o("Ved føring"),
  o("Sang/spill, ikke hekking"),
  o("Lokkelyd, øvrige lyder"),
  o("Revir, ikke hekking"),
  o("Ringmerket"),
  o("Individmerket (kontroll)"),
  o("Trekkforsøk"),
  o("Trekkende"),
  o("Trekkende mot N"),
  o("Trekkende mot NØ"),
  o("Trekkende mot Ø"),
  o("Trekkende mot SØ"),
  o("Trekkende mot S"),
  o("Trekkende mot SV"),
  o("Trekkende mot V"),
  o("Trekkende mot NV"),
  o("Syk"),
  o("Død - kollisjon med kraftledning"),
  o("Død - kollisjon med vindturbin"),
  o("Død - kollisjon med vindu"),
  o("Død - kollisjon med fyr"),
  o("Død - kollisjon med fly"),
  o("Død - kollisjon med gjerde"),
  o("Drept av elektrokusjon (strømslag)"),
  o("Drept av olje"),
  o("Trafikkdrept"),
  o("Garndød"),
  o("Skadet av fiskeredskap"),
  o("Drept av predator"),
  o("Død av sykdom/sult"),
  o("Skutt/avlivet"),
  o("Død - ukjent dødsårsak"),
  o("Ferske spor"),
  o("Eldre spor"),
  o("Fersk møkk"),
  o("Eldre møkk"),
];

const AMPHIBIAN_REPTILE_OPTIONS: ActivityOption[] = [
  UNKNOWN,
  o("Næringssøkende"),
  o("Hvilende"),
  o("Trafikkdrept"),
  o("Drept av predator"),
  o("Skutt/avlivet"),
  o("Funnet død"),
  o("Syk"),
  o("I vann"),
  o("Trekkende"),
  o("I lekdrakt"),
  o("Sang/spill"),
  o("Reirbyggende/brukt bo/hus"),
  o("Paring (eller seremonier)"),
  o("Drektig hunn"),
  o("Egglegging"),
  o("Dvale"),
  o("Overvintringsplass"),
  o("Rester etter hudskifte"),
  o("Soling"),
];

const FISH_OPTIONS: ActivityOption[] = [
  UNKNOWN,
  o("Næringssøkende"),
  o("Drept av predator"),
  o("Funnet død"),
  o("I lekdrakt"),
  o("Paring (eller seremonier)"),
  o("Gyting"),
  o("Vandrende"),
  o("Svømmende"),
  o("Trekkende"),
  o("Dvale"),
  o("Trafikkdrept"),
  o("Fragment"),
];

const INVERTEBRATE_OPTIONS: ActivityOption[] = [
  UNKNOWN,
  o("Næringssøkende"),
  o("Frittflygende"),
  o("Frittspringende/krypende"),
  o("Galle"),
  o("Mine"),
  o("Hvilende"),
  o("Gravende"),
  o("Svømmende"),
  o("Trekkende"),
  o("Dvale"),
  o("Trafikkdrept"),
  o("Drept av predator"),
  o("Funnet død"),
  o("Fragment"),
  o("Kokong/larve-/puppehud"),
  o("Revirhevdende"),
  o("Sang/spill"),
  o("Paring (eller seremonier)"),
  o("Reirbyggende/brukt bo/hus"),
  o("Egglegging"),
  o("Klekkende"),
  o("Ferske gnagespor/hull"),
  o("Eldre gnagespor/hull"),
  o("Fersk møkk"),
  o("Eldre møkk"),
];

const MAMMAL_OPTIONS: ActivityOption[] = [
  UNKNOWN,
  o("Næringssøkende"),
  o("Hvilende"),
  o("Dvale"),
  o("Svømmende"),
  o("Trafikkdrept"),
  o("Skutt/avlivet"),
  o("Drept av predator"),
  o("Garndød"),
  o("Funnet død"),
  o("Hår/skjelettrester"),
  o("Syk"),
  o("Stasjonær"),
  o("Kamper mellom hanner"),
  o("Reirbyggende/brukt bo/hus"),
  o("Hann med velutviklet bitestikkel"),
  o("Lokkelyd, øvrige lyder"),
  o("Sang/spill"),
  o("Paring (eller seremonier)"),
  o("Drektig hunn"),
  o("Ammende/lakterende hunn"),
  o("Hunn med unge(r)"),
  o("Spor etter voksent dyr med unge(r)"),
  o("Bytte-/matrester"),
  o("Ferske gnagespor/hull"),
  o("Gnagespor"),
  o("Ferske spor"),
  o("Eldre spor"),
  o("Fersk møkk"),
  o("Eldre møkk"),
  o("Hopp"),
  o("Konstant kurs, regelmessig dykking"),
  o("Variabel kurs/uregelmessig dykking"),
  o("Langsom forflytning, lang tid ved overflaten"),
  o("Nærmer seg båten"),
  o("Yngleplass/unger"),
  o("Overvintringsplass"),
  o("Død - kollisjon med vindturbin"),
];

const DEFAULT_OPTIONS: ActivityOption[] = [UNKNOWN];

const TAXON_GROUP_ACTIVITY_MAP: Record<string, ActivityOption[]> = {
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
};

export function getActivityOptionsForTaxonGroup(
  taxonGroup: string,
): ActivityOption[] {
  const key = taxonGroup.toLowerCase().trim();
  return TAXON_GROUP_ACTIVITY_MAP[key] ?? DEFAULT_OPTIONS;
}

/**
 * Returns the top-N most frequently used activity values for the given taxon
 * group, derived from past observations. Only values present in the canonical
 * options list are counted (ignores legacy free-text entries).
 */
export function getTopActivitiesForTaxonGroup(
  observations: Array<{ species: Array<{ species: { TaxonGroup?: string }; activity?: string }> }>,
  taxonGroup: string,
  topN = 6,
): ActivityOption[] {
  const canonical = new Set(
    getActivityOptionsForTaxonGroup(taxonGroup)
      .map((o) => o.value)
      .filter(Boolean),
  );
  const tgLower = taxonGroup.toLowerCase().trim();
  const counts = new Map<string, number>();

  for (const obs of observations) {
    for (const s of obs.species) {
      const sg = (s.species.TaxonGroup || "").toLowerCase().trim();
      if (sg !== tgLower) continue;
      const act = s.activity;
      if (!act || !canonical.has(act)) continue;
      counts.set(act, (counts.get(act) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([value]) => ({ value, label: value }));
}
