import { describe, expect, it } from "vitest";
import { sortSpeciesByTaxonGroupAndName } from "./utils";
import { Species } from "../types/observation";

function makeSpecies(
  overrides: Partial<Species> & { species: Partial<Species["species"]> },
): Species {
  return {
    id: "id",
    createdAt: "2026-01-01T10:00:00.000Z",
    ...overrides,
    species: {
      ...overrides.species,
    },
  };
}

describe("sortSpeciesByTaxonGroupAndName", () => {
  it("orders species by taxon group order, then alphabetically within group", () => {
    const species = [
      makeSpecies({
        id: "1",
        species: { PrefferedPopularname: "Rådyr", TaxonGroup: "pattedyr" },
      }),
      makeSpecies({
        id: "2",
        species: { PrefferedPopularname: "Blåmeis", TaxonGroup: "fugler" },
      }),
      makeSpecies({
        id: "3",
        species: { PrefferedPopularname: "Ærfugl", TaxonGroup: "fugler" },
      }),
      makeSpecies({
        id: "4",
        species: { PrefferedPopularname: "Elg", TaxonGroup: "pattedyr" },
      }),
    ];

    const sorted = sortSpeciesByTaxonGroupAndName(species);

    expect(sorted.map((s) => s.id)).toEqual(["2", "3", "4", "1"]);
  });

  it("sorts species with unknown or missing taxon group last", () => {
    const species = [
      makeSpecies({
        id: "1",
        species: { PrefferedPopularname: "Ukjent art", TaxonGroup: undefined },
      }),
      makeSpecies({
        id: "2",
        species: { PrefferedPopularname: "Blåmeis", TaxonGroup: "fugler" },
      }),
    ];

    const sorted = sortSpeciesByTaxonGroupAndName(species);

    expect(sorted.map((s) => s.id)).toEqual(["2", "1"]);
  });

  it("falls back to ValidScientificName when PrefferedPopularname is missing", () => {
    const species = [
      makeSpecies({
        id: "1",
        species: {
          PrefferedPopularname: "Ukjent",
          ValidScientificName: "Zeta",
          TaxonGroup: "fugler",
        },
      }),
      makeSpecies({
        id: "2",
        species: {
          PrefferedPopularname: "Ukjent",
          ValidScientificName: "Alfa",
          TaxonGroup: "fugler",
        },
      }),
    ];

    const sorted = sortSpeciesByTaxonGroupAndName(species);

    expect(sorted.map((s) => s.id)).toEqual(["1", "2"]);
  });

  it("does not mutate the input array", () => {
    const species = [
      makeSpecies({
        id: "1",
        species: { PrefferedPopularname: "B", TaxonGroup: "fugler" },
      }),
      makeSpecies({
        id: "2",
        species: { PrefferedPopularname: "A", TaxonGroup: "fugler" },
      }),
    ];
    const original = [...species];

    sortSpeciesByTaxonGroupAndName(species);

    expect(species).toEqual(original);
  });
});
