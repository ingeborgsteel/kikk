# Sort Species List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users manually sort the species list in ObservationForm by taxon group + name, and automatically apply that same sort whenever an observation is saved so MyObservations/export show a consistent order.

**Architecture:** A single pure sort function `sortSpeciesByTaxonGroupAndName` lives in `src/react-app/lib/utils.ts`, ordering by position in `TAXON_GROUP_KEYS` then alphabetically (`no` locale). `ObservationForm.tsx` calls it from a new "Sorter" button (one-shot reorder of the field array) and from `save`/`saveAndAddAnother` before persisting.

**Tech Stack:** React, react-hook-form, TypeScript, Vitest.

---

### Task 1: Add `sortSpeciesByTaxonGroupAndName` to `lib/utils.ts`

**Files:**
- Modify: `src/react-app/lib/utils.ts`
- Test: `src/react-app/lib/utils.test.ts` (new file)

- [ ] **Step 1: Write the failing test**

Create `src/react-app/lib/utils.test.ts`:

```typescript
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
      PrefferedPopularname: "Ukjent",
      ...overrides.species,
    },
  };
}

describe("sortSpeciesByTaxonGroupAndName", () => {
  it("orders species by taxon group order, then alphabetically within group", () => {
    const species = [
      makeSpecies({ id: "1", species: { PrefferedPopularname: "Rådyr", TaxonGroup: "pattedyr" } }),
      makeSpecies({ id: "2", species: { PrefferedPopularname: "Blåmeis", TaxonGroup: "fugler" } }),
      makeSpecies({ id: "3", species: { PrefferedPopularname: "Ærfugl", TaxonGroup: "fugler" } }),
      makeSpecies({ id: "4", species: { PrefferedPopularname: "Elg", TaxonGroup: "pattedyr" } }),
    ];

    const sorted = sortSpeciesByTaxonGroupAndName(species);

    expect(sorted.map((s) => s.id)).toEqual(["2", "3", "4", "1"]);
  });

  it("sorts species with unknown or missing taxon group last", () => {
    const species = [
      makeSpecies({ id: "1", species: { PrefferedPopularname: "Ukjent art", TaxonGroup: undefined } }),
      makeSpecies({ id: "2", species: { PrefferedPopularname: "Blåmeis", TaxonGroup: "fugler" } }),
    ];

    const sorted = sortSpeciesByTaxonGroupAndName(species);

    expect(sorted.map((s) => s.id)).toEqual(["2", "1"]);
  });

  it("falls back to ValidScientificName when PrefferedPopularname is missing", () => {
    const species = [
      makeSpecies({
        id: "1",
        species: { PrefferedPopularname: undefined, ValidScientificName: "Zeta", TaxonGroup: "fugler" },
      }),
      makeSpecies({
        id: "2",
        species: { PrefferedPopularname: undefined, ValidScientificName: "Alfa", TaxonGroup: "fugler" },
      }),
    ];

    const sorted = sortSpeciesByTaxonGroupAndName(species);

    expect(sorted.map((s) => s.id)).toEqual(["2", "1"]);
  });

  it("does not mutate the input array", () => {
    const species = [
      makeSpecies({ id: "1", species: { PrefferedPopularname: "B", TaxonGroup: "fugler" } }),
      makeSpecies({ id: "2", species: { PrefferedPopularname: "A", TaxonGroup: "fugler" } }),
    ];
    const original = [...species];

    sortSpeciesByTaxonGroupAndName(species);

    expect(species).toEqual(original);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/react-app/lib/utils.test.ts`
Expected: FAIL with `sortSpeciesByTaxonGroupAndName is not a function` (or similar import error)

- [ ] **Step 3: Write the implementation**

In `src/react-app/lib/utils.ts`, add this import at the top (alongside existing imports):

```typescript
import { Species } from "../types/observation";
import { TAXON_GROUP_KEYS } from "./taxonGroups";
```

Then add the function (e.g. after `getLifeList`, before `rankSpeciesResults`):

```typescript
/**
 * Sort species by taxon group (systematic order from TAXON_GROUP_KEYS),
 * then alphabetically by preferred popular name within each group.
 * Species with an unknown/missing taxon group sort last.
 * Returns a new array; does not mutate the input.
 */
export function sortSpeciesByTaxonGroupAndName(species: Species[]): Species[] {
  const groupIndex = (taxonGroup?: string): number => {
    if (!taxonGroup) return TAXON_GROUP_KEYS.length;
    const index = TAXON_GROUP_KEYS.indexOf(
      taxonGroup.toLowerCase().trim() as (typeof TAXON_GROUP_KEYS)[number],
    );
    return index === -1 ? TAXON_GROUP_KEYS.length : index;
  };

  const nameOf = (s: Species): string =>
    s.species.PrefferedPopularname || s.species.ValidScientificName || "";

  return [...species].sort((a, b) => {
    const groupDiff = groupIndex(a.species.TaxonGroup) - groupIndex(b.species.TaxonGroup);
    if (groupDiff !== 0) return groupDiff;
    return nameOf(a).localeCompare(nameOf(b), "no");
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/react-app/lib/utils.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/react-app/lib/utils.ts src/react-app/lib/utils.test.ts
git commit -m "Add sortSpeciesByTaxonGroupAndName helper"
```

---

### Task 2: Add manual "Sorter" button to ObservationForm

**Files:**
- Modify: `src/react-app/components/ObservationForm.tsx:637-646`

- [ ] **Step 1: Import the helper**

In `src/react-app/components/ObservationForm.tsx`, update the existing import from `../lib/utils.ts` (around line 13-17):

```typescript
import {
  getRecentSpecies,
  rankSpeciesResults,
  reverseGeocode,
  sortSpeciesByTaxonGroupAndName,
} from "../lib/utils.ts";
```

- [ ] **Step 2: Add the sort handler and button**

Locate the block starting at line 637 in `ObservationForm.tsx`:

```tsx
                  <div>
                    <Label className="text-bark dark:text-sand">
                      Observerte arter
                    </Label>
                    {species.length === 0 && (
```

Replace it with (adds a `sortSpecies` handler and a "Sorter" button shown only when there are 2+ species):

```tsx
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-bark dark:text-sand">
                        Observerte arter
                      </Label>
                      {species.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            onChange(sortSpeciesByTaxonGroupAndName(species))
                          }
                          className="text-xs text-slate hover:text-bark dark:hover:text-sand transition-colors"
                        >
                          Sorter
                        </button>
                      )}
                    </div>
                    {species.length === 0 && (
```

Note: this is inside the `Controller` render prop, so `species` and `onChange` are already in scope (same as `addSpecies`, `removeSpecies` above it).

- [ ] **Step 3: Manually verify in the browser**

Run: `npm run dev`

- Open the app, start a new observation ("Opprett kikk"), add 3+ species from different taxon groups (e.g. a bird, a mammal, a plant) using free-text entry.
- Confirm a "Sorter" button appears next to "Observerte arter" once 2+ species are added.
- Click it and confirm the list reorders to taxon-group + alphabetical order.
- Add another species after sorting and confirm it's inserted at the top of the list (not re-sorted automatically).

- [ ] **Step 4: Commit**

```bash
git add src/react-app/components/ObservationForm.tsx
git commit -m "Add manual sort button for species list in ObservationForm"
```

---

### Task 3: Auto-sort species on save

**Files:**
- Modify: `src/react-app/components/ObservationForm.tsx:327-420` (the `save` and `saveAndAddAnother` callbacks)

- [ ] **Step 1: Update `save`**

Locate the `save` callback (around line 327-366). Change:

```typescript
  const save = useCallback(
    (data: Observation) => {
      const startDate =
        toStorageDateTimeValue(data.startDate, startTimeEnabled) ||
        dayjs().format(DATE_TIME_STORAGE_FORMAT);
      const endDate = toStorageDateTimeValue(data.endDate, endTimeEnabled);

      if (data.id) {
        updateObservation({
          ...data,
          locationId: presetLocation?.id ?? data.locationId,
          startDate,
          endDate,
        });
      } else {
        if (data.observerName) sessionObserverName = data.observerName;
        addObservation({
          ...data,
          locationId: presetLocation?.id,
          startDate,
          endDate,
        });
```

to:

```typescript
  const save = useCallback(
    (data: Observation) => {
      const startDate =
        toStorageDateTimeValue(data.startDate, startTimeEnabled) ||
        dayjs().format(DATE_TIME_STORAGE_FORMAT);
      const endDate = toStorageDateTimeValue(data.endDate, endTimeEnabled);
      const species = sortSpeciesByTaxonGroupAndName(data.species);

      if (data.id) {
        updateObservation({
          ...data,
          species,
          locationId: presetLocation?.id ?? data.locationId,
          startDate,
          endDate,
        });
      } else {
        if (data.observerName) sessionObserverName = data.observerName;
        addObservation({
          ...data,
          species,
          locationId: presetLocation?.id,
          startDate,
          endDate,
        });
```

(The rest of the function, including `onClose()` and the closing brace/deps array, is unchanged.)

- [ ] **Step 2: Update `saveAndAddAnother`**

Locate `saveAndAddAnother` (around line 368-407). Change:

```typescript
  const saveAndAddAnother = useCallback(
    (data: Observation) => {
      const startDate =
        toStorageDateTimeValue(data.startDate, startTimeEnabled) ||
        dayjs().format(DATE_TIME_STORAGE_FORMAT);
      const endDate = toStorageDateTimeValue(data.endDate, endTimeEnabled);

      if (data.observerName) sessionObserverName = data.observerName;
      addObservation({
        ...data,
        locationId: presetLocation?.id,
        startDate,
        endDate,
      });
```

to:

```typescript
  const saveAndAddAnother = useCallback(
    (data: Observation) => {
      const startDate =
        toStorageDateTimeValue(data.startDate, startTimeEnabled) ||
        dayjs().format(DATE_TIME_STORAGE_FORMAT);
      const endDate = toStorageDateTimeValue(data.endDate, endTimeEnabled);

      if (data.observerName) sessionObserverName = data.observerName;
      addObservation({
        ...data,
        species: sortSpeciesByTaxonGroupAndName(data.species),
        locationId: presetLocation?.id,
        startDate,
        endDate,
      });
```

(The rest of the function — success message, `reset(...)`, etc. — is unchanged.)

- [ ] **Step 3: Manually verify in the browser**

Run: `npm run dev` (if not already running)

- Create a new observation, add species out of order (e.g. plant, then bird, then mammal), and save without clicking "Sorter".
- Open "Mine observasjoner" (MyObservations) and edit that observation — confirm the species list now displays in taxon-group + alphabetical order.
- Repeat using "Lagre og legg til ny" (`saveAndAddAnother`) and confirm the saved observation (visible via edit) is also sorted.
- Edit an existing observation, add one more out-of-group species, save, and confirm the full list re-sorts on that save too.

- [ ] **Step 4: Run full test suite**

Run: `npm run test`
Expected: all tests pass (including Task 1's new tests)

- [ ] **Step 5: Commit**

```bash
git add src/react-app/components/ObservationForm.tsx
git commit -m "Sort species by taxon group and name when saving observations"
```

---

## Plan Self-Review Notes

- Spec coverage: Task 1 = shared helper (spec §1), Task 2 = manual button (spec §2), Task 3 = auto-sort on save for both new and edited observations (spec §3). All three spec sections covered.
- No placeholders: all steps contain concrete code/commands.
- Type consistency: `sortSpeciesByTaxonGroupAndName(species: Species[]): Species[]` signature is identical across Task 1's implementation and Task 2/3's call sites.
