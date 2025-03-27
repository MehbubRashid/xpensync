import * as S from "@effect/schema/Schema";
import { 
  id, 
  table, 
  database,
  NonEmptyString1000,
  SqliteBoolean,
  createIndexes
} from "@evolu/react";

// Define branded IDs for our entities
const WalletId = id("Wallet");
type WalletId = typeof WalletId.Type;

const CategoryId = id("Category");
type CategoryId = typeof CategoryId.Type;

const EntryId = id("Entry");
type EntryId = typeof EntryId.Type;

const SettingsId = id("Settings");
type SettingsId = typeof SettingsId.Type;

// Define a custom non-empty string type for names
const NonEmptyString100 = S.String.pipe(
  S.minLength(1),
  S.maxLength(100),
  S.brand("NonEmptyString100")
);
type NonEmptyString100 = S.Schema.Type<typeof NonEmptyString100>;

// Define the Currency type
const Currency = S.String.pipe(
  S.pattern(/^[A-Z]{3,4}$/),
  S.brand("Currency")
);
type Currency = S.Schema.Type<typeof Currency>;

// Define the EntryType using literal types
const EntryType = S.Union(
  S.Literal("income"),
  S.Literal("expense"), 
  S.Literal("transfer"),
  S.Literal("topup")
);
type EntryType = S.Schema.Type<typeof EntryType>;

// Define our tables
const WalletTable = table({
  id: WalletId,
  name: NonEmptyString100,
});
type WalletTable = typeof WalletTable.Type;


const SettingsTable = table({
  id: SettingsId,
  key: NonEmptyString100,
  value: S.String,
});
type SettingsTable = typeof SettingsTable.Type;

const CategoryTable = table({
  id: CategoryId,
  name: NonEmptyString100,
  type: S.Union(S.Literal("income"), S.Literal("expense")),
});
type CategoryTable = typeof CategoryTable.Type;

const EntryTable = table({
  id: EntryId,
  type: EntryType,
  amount: S.Number,
  currency: Currency,
  description: S.NullOr(NonEmptyString1000),
  categoryId: S.NullOr(CategoryId),
  walletId: WalletId,
  date: S.String,
  // For transfer transactions
  toWalletId: S.NullOr(WalletId),
  receivedAmount: S.NullOr(S.Number),
  receivedCurrency: S.NullOr(Currency),
});
type EntryTable = typeof EntryTable.Type;

// Define the database with all tables
const Database = database({
  wallet: WalletTable,
  category: CategoryTable,
  entry: EntryTable,
  settings: SettingsTable,
});
type Database = typeof Database.Type;

// Create indexes for better performance
const indexes = createIndexes((create) => [
  create("indexEntryDate").on("entry").column("date"),
  create("indexEntryWalletId").on("entry").column("walletId"),
  create("indexEntryCategoryId").on("entry").column("categoryId"),
  create("indexCategoryType").on("category").column("type"),
  create("indexSettingsKey").on("settings").column("key"),
]);

// Export the schema and types
export { 
  Database, 
  indexes, 
  NonEmptyString100, 
  Currency, 
  EntryType,
  WalletId, 
  CategoryId, 
  EntryId,
  SettingsId
};
export type { 
  WalletTable, 
  CategoryTable, 
  EntryTable,
  SettingsTable
}; 