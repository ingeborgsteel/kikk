# Sort species list (issue #155)

## Problem

When many species are registered on a location in the observation form, it's easy to lose track of what's already been noted, since species are added to the top of the list in add order. Users want a way to see the list ordered systematically (taxon group, then alphabetically), without losing the ability to spot the species they just added.

## Design

### 1. Shared sort helper

Add `sortSpeciesByTaxonGroupAndName(species: Species[]): Species[]` to `src/react-app/lib/utils.ts`.

- Primary key: taxon group, ordered by position in `TAXON_GROUP_KEYS` (from `lib/taxonGroups.ts`). Species with an unknown/missing `TaxonGroup` sort last.
- Secondary key: alphabetical by `PrefferedPopularname` (falling back to `ValidScientificName`), using `localeCompare` with Norwegian (`nb`) collation.
- Pure function, returns a new array; does not mutate input.

### 2. Manual sort button (ObservationForm)

In `ObservationForm.tsx`, add a "Sorter" button next to the "Observerte arter" label (near line 637-646, where the species list is rendered).

- On click: replaces the current `species` field array with `sortSpeciesByTaxonGroupAndName(species)` via the existing `onChange`.
- One-shot action, not a toggle — no persistent sorted state. After sorting, newly added species still go to the top of the list (existing `addSpecies` behavior via `onChange([newObservation, ...species])` is unchanged), so users can still find what they just added.
- Button is inert (or could be omitted) when `species.length < 2`.

### 3. Auto-sort on save

In `ObservationForm.tsx`, apply `sortSpeciesByTaxonGroupAndName` to `data.species` inside both `save` and `saveAndAddAnother`, before calling `addObservation` / `updateObservation`. Applies to both new and edited observations.

This keeps stored order consistent so `MyObservations.tsx` and Excel export (which just render/consume `observation.species` in stored order) show species in the same taxon-group + alphabetical order without needing any changes in `ObservationsContext`, `ObservationItem`, or `ExportDialog`.

## Out of scope

- No toggle between systematic/alphabetical/chronological sort modes (per issue's fallback suggestion, systematic+alphabetical is sufficient).
- No changes to `ObservationsContext`, `MyObservations.tsx`, or export logic — sorting happens once at save time.
