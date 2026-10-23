import {
  customType,
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Full TaxonRecord from Artsdatabanken API.
 * Duplicated from frontend types due to separate TypeScript project references.
 */
export interface TaxonRecord {
  Id?: number;
  DateTimeUpdated?: string;
  CategoryValue?: number;
  TaxonId?: number;
  ParentTaxonId?: number;
  ValidScientificNameId?: number;
  ValidScientificName?: string;
  ValidScientificNameFormatted?: string;
  ValidScientificNameAuthorship?: string;
  PrefferedPopularname?: string;
  MatchedName?: string;
  TaxonGroup?: string;
  TaxonGroupId?: number;
  ExistsInCountry?: boolean;
  ScientificNames?: ScientificName[];
  PopularNames?: PopularName[];
  TaxonTags?: TaxonTag[];
  Status?: string;
  StatusPrefix?: string;
  ScientificNameIdHiarchy?: number[];
  TaxonIdHiarchy?: number[];
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

export interface ScientificName {
  ScientificNameId: number;
  Accepted: boolean;
  ScientificName: string;
  ScientificNameFormatted: string;
  ScientificNameAuthorship: string;
}

export interface PopularName {
  vernacularNameID: number;
  language: string;
  Name: string;
  Preffered: boolean;
}

export interface TaxonTag {
  TagGroup: string;
  Prefix: string;
  Context: string;
  Tag: string;
  Url: string;
  ScientificName: string;
}

/**
 * TaxonRecord with large nested arrays removed for D1 storage.
 * D1 has a 1MB row size limit, and the full Artsdatabanken response
 * with ScientificNames, PopularNames, and TaxonTags arrays exceeds this.
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

/**
 * Normalize a full Artsdatabanken TaxonRecord to a minimal version for storage.
 * Removes large nested arrays (ScientificNames, PopularNames, TaxonTags) that
 * exceed D1's row size limits.
 */
export function normalizeTaxonRecord(
  fullRecord: TaxonRecord,
): StoredTaxonRecord {
  return {
    Id: fullRecord.Id,
    TaxonId: fullRecord.TaxonId,
    ValidScientificNameId: fullRecord.ValidScientificNameId,
    ValidScientificName: fullRecord.ValidScientificName,
    ValidScientificNameFormatted: fullRecord.ValidScientificNameFormatted,
    ValidScientificNameAuthorship: fullRecord.ValidScientificNameAuthorship,
    PrefferedPopularname: fullRecord.PrefferedPopularname,
    MatchedName: fullRecord.MatchedName,
    TaxonGroup: fullRecord.TaxonGroup,
    TaxonGroupId: fullRecord.TaxonGroupId,
    ExistsInCountry: fullRecord.ExistsInCountry,
    Status: fullRecord.Status,
    StatusPrefix: fullRecord.StatusPrefix,
    ScientificNameIdHiarchy: fullRecord.ScientificNameIdHiarchy,
    TaxonIdHiarchy: fullRecord.TaxonIdHiarchy,
    Kingdom: fullRecord.Kingdom,
    Phylum: fullRecord.Phylum,
    Class: fullRecord.Class,
    Order: fullRecord.Order,
    Family: fullRecord.Family,
    Genus: fullRecord.Genus,
    Species: fullRecord.Species,
    SubSpecies: fullRecord.SubSpecies,
    IsDeleted: fullRecord.IsDeleted,
  };
}

const timestamp = customType<{ data: Date; driverData: string }>({
  dataType() {
    return "date";
  },
  toDriver(value) {
    return value instanceof Date ? value.toISOString() : value;
  },
  fromDriver(value) {
    return new Date(value as string);
  },
});

export const observations = sqliteTable("observations", {
  id: text("id").primaryKey(),
  userId: text("userId"),
  location: text("location", { mode: "json" })
    .$type<{ lat: number; lng: number }>()
    .notNull(),
  locationName: text("locationName"),
  uncertaintyRadius: integer("uncertaintyRadius").notNull(),
  startDate: text("startDate").notNull(),
  endDate: text("endDate"),
  comment: text("comment").notNull(),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
  lastExportedAt: text("lastExportedAt"),
  exportCount: integer("exportCount").default(0),
  locationId: text("locationId"),
  observerName: text("observerName"),
  project: text("project"),
});

export const species = sqliteTable("species", {
  id: text("id").primaryKey(),
  observationId: text("observationId").notNull(),
  createdAt: text("createdAt").notNull(),
  species: text("species", { mode: "json" })
    .$type<StoredTaxonRecord>()
    .notNull(),
  gender: text("gender"),
  count: integer("count"),
  unit: text("unit"),
  age: text("age"),
  method: text("method"),
  activity: text("activity"),
  comment: text("comment"),
  privateComment: text("privateComment"),
  notRediscovered: integer("notRediscovered", { mode: "boolean" }).default(
    false,
  ),
  notFound: integer("notFound", { mode: "boolean" }).default(false),
  privateCollection: text("privateCollection"),
  secondHand: integer("secondHand", { mode: "boolean" }).default(false),
  uncertainIdentification: integer("uncertainIdentification", {
    mode: "boolean",
  }).default(false),
  biotope: text("biotope"),
  biotopeDescription: text("biotopeDescription"),
  hide: integer("hide", { mode: "boolean" }).default(false),
  delayPublication: text("delayPublication"),
});

export const locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  userId: text("userId"),
  name: text("name").notNull(),
  location: text("location", { mode: "json" })
    .$type<{ lat: number; lng: number }>()
    .notNull(),
  uncertaintyRadius: integer("uncertaintyRadius").notNull(),
  description: text("description"),
  createdAt: text("createdAt").notNull(),
  updatedAt: text("updatedAt").notNull(),
});

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  role: text("role"),
  banned: integer("banned", { mode: "boolean" }).default(false),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires"),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonatedBy"),
});

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    issuer: text("issuer").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
  },
  (table) => [
    uniqueIndex("account_issuer_accountId_uidx").on(
      table.issuer,
      table.accountId,
    ),
  ],
);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const userAccesses = sqliteTable("user_accesses", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  github_token: text("github_token").notNull(),
  created_at: text("created_at").notNull(),
});

export const featureAlertDismissals = sqliteTable(
  "feature_alert_dismissals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    alertId: text("alert_id").notNull(),
    dismissedAt: text("dismissed_at").notNull(),
  },
  (table) => [
    uniqueIndex("feature_alert_dismissals_user_alert_uidx").on(
      table.userId,
      table.alertId,
    ),
  ],
);

export type Observation = typeof observations.$inferSelect;
export type InsertObservation = typeof observations.$inferInsert;
export type Species = typeof species.$inferSelect;
export type InsertSpecies = typeof species.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = typeof locations.$inferInsert;
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type UserAccess = typeof userAccesses.$inferSelect;
export type InsertUserAccess = typeof userAccesses.$inferInsert;
export type FeatureAlertDismissal = typeof featureAlertDismissals.$inferSelect;
export type InsertFeatureAlertDismissal =
  typeof featureAlertDismissals.$inferInsert;
