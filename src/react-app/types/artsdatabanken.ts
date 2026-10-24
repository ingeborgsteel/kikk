export interface TaxonRecord {
  Id?: number;
  DateTimeUpdated?: string; // ISO 8601
  CategoryValue?: number;

  TaxonId?: number;
  ParentTaxonId?: number;
  ValidScientificNameId?: number;
  ValidScientificName?: string;
  ValidScientificNameFormatted?: string; // contains HTML (e.g. <i>...</i>)
  ValidScientificNameAuthorship?: string;

  PrefferedPopularname?: string; // note: spelling as in source
  MatchedName?: string;

  TaxonGroup?: string;
  TaxonGroupId?: number;

  ExistsInCountry?: boolean;

  // These arrays are NOT stored in D1 to avoid row size limits
  // They are only present in fresh API responses from Artsdatabanken
  ScientificNames?: ScientificName[];
  PopularNames?: PopularName[];
  TaxonTags?: TaxonTag[];

  Status?: string; // e.g. "EN"
  StatusPrefix?: string; // e.g. "RL2021N"

  ScientificNameIdHiarchy?: number[]; // note: spelling as in source
  TaxonIdHiarchy?: number[]; // note: spelling as in source

  Kingdom?: string;
  Phylum?: string;
  Class?: string;
  Order?: string;
  Family?: string;
  Genus?: string;
  Species?: string;
  SubSpecies?: string | null;

  IsDeleted?: boolean;
}

/**
 * TaxonRecord with large nested arrays removed.
 * This is what gets stored in D1 to avoid the 1MB row size limit.
 */
export type StoredTaxonRecord = Omit<
  TaxonRecord,
  | "DateTimeUpdated"
  | "CategoryValue"
  | "ParentTaxonId"
  | "ScientificNames"
  | "PopularNames"
  | "TaxonTags"
>;

export interface ScientificName {
  ScientificNameId: number;
  Accepted: boolean;
  ScientificName: string;
  ScientificNameFormatted: string; // contains HTML
  ScientificNameAuthorship: string;
}

export interface PopularName {
  vernacularNameID: number;
  language: string; // e.g. "nb-NO"
  Name: string;
  Preffered: boolean; // note: spelling as in source
}

export interface TaxonTag {
  TagGroup: string;
  Prefix: string;
  Context: string;
  Tag: string;
  Url: string;
  ScientificName: string; // empty string in sample, but keep as string
}
