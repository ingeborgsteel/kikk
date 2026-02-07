export interface TaxonRecord {
  Id: number;
  DateTimeUpdated: string; // ISO 8601
  CategoryValue: number;

  TaxonId: number;
  ParentTaxonId: number;
  ValidScientificNameId: number;
  ValidScientificName: string;
  ValidScientificNameFormatted: string; // contains HTML (e.g. <i>...</i>)
  ValidScientificNameAuthorship: string;

  PrefferedPopularname: string; // note: spelling as in source
  MatchedName: string;

  TaxonGroup: string;
  TaxonGroupId: number;

  ExistsInCountry: boolean;

  ScientificNames: ScientificName[];
  PopularNames: PopularName[];
  TaxonTags: TaxonTag[];

  Status: string; // e.g. "EN"
  StatusPrefix: string; // e.g. "RL2021N"

  ScientificNameIdHiarchy: number[]; // note: spelling as in source
  TaxonIdHiarchy: number[]; // note: spelling as in source

  Kingdom: string;
  Phylum: string;
  Class: string;
  Order: string;
  Family: string;
  Genus: string;
  Species: string;
  SubSpecies: string | null;

  IsDeleted: boolean;
}

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
