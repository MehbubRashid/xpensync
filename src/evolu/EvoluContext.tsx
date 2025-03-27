import React, { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import * as S from "@effect/schema/Schema";
import { 
  useEvolu as useEvoluReact, 
  createEvolu, 
  useQuery, 
  EvoluProvider as EvoluReactProvider,
  useEvoluError,
  cast,
  jsonArrayFrom,
  ExtractRow,
  NonEmptyString1000,
} from '@evolu/react';
import { 
  Database, 
  indexes, 
  NonEmptyString100,
  Currency, 
  WalletId,
  CategoryId,
  EntryId,
  SettingsId
} from './schema';

// Create an Evolu instance
const evolu = createEvolu(Database, {
  indexes,
  name: 'asset-arbor-tracker',
  // Enable this when you're ready for sync
  // syncUrl: 'https://sync.evolu.dev',
  initialData: (evolu) => {
    // Create a default "Cash" wallet if none exists
    evolu.create("wallet", {
      name: S.decodeSync(NonEmptyString100)("Cash"),
    });
  },
});

// Export the useEvolu hook
export const useEvolu = useEvoluReact;

// Define queries
const walletsQuery = evolu.createQuery((db) => 
  db.selectFrom("wallet")
    .selectAll()
    .where("isDeleted", "is not", cast(true))
    .orderBy("name")
);

const settingsQuery = evolu.createQuery((db) => 
  db.selectFrom("settings")
    .selectAll()
    .where("isDeleted", "is not", cast(true))
    .orderBy("key")
);

const categoriesQuery = evolu.createQuery((db) => 
  db.selectFrom("category")
    .selectAll()
    .where("isDeleted", "is not", cast(true))
    .orderBy("name")
);

const entriesQuery = evolu.createQuery((db) => 
  db.selectFrom("entry")
    .selectAll()
    .where("isDeleted", "is not", cast(true))
    .orderBy("date", "desc")
);

// Detailed entry query with category and wallet information
const entriesWithDetailsQuery = evolu.createQuery((db) =>
  db.selectFrom("entry")
    .selectAll()
    .where("isDeleted", "is not", cast(true))
    .orderBy("date", "desc")
    .select((eb) => [
      jsonArrayFrom(
        eb.selectFrom("category")
          .select(["category.id", "category.name", "category.type"])
          .where("isDeleted", "is not", cast(true))
      ).as("categories"),
      jsonArrayFrom(
        eb.selectFrom("wallet")
          .select(["wallet.id", "wallet.name"])
          .where("isDeleted", "is not", cast(true))
      ).as("wallets")
    ])
);

// Types for query results
type WalletRow = ExtractRow<typeof walletsQuery>;
type CategoryRow = ExtractRow<typeof categoriesQuery>;
type EntryRow = ExtractRow<typeof entriesQuery>;
type EntryWithDetailsRow = ExtractRow<typeof entriesWithDetailsQuery>;

// Our own provider that wraps Evolu's provider
export const EvoluProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <EvoluReactProvider value={evolu}>
      {children}
    </EvoluReactProvider>
  );
};

// Error notification - useful for displaying Evolu errors
export const EvoluErrorNotification: React.FC = () => {
  const evoluError = useEvoluError();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (evoluError) setShowError(true);
  }, [evoluError]);

  if (!evoluError || !showError) return null;

  return (
    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
      <p>{`Error: ${JSON.stringify(evoluError)}`}</p>
      <button 
        onClick={() => setShowError(false)}
        className="bg-red-200 px-2 py-1 rounded mt-2"
      >
        Close
      </button>
    </div>
  );
};

// Wallet operations hook - updated to use Evolu
export const useWallets = () => {
  // Use Evolu hooks
  const { create, update } = useEvolu<Database>();
  
  // Get wallets using Evolu query
  const getWallets = () => {
    return useQuery(walletsQuery);
  };
  
  // Add a wallet using Evolu mutation
  const addWallet = (name: string) => {
    return create("wallet", {
      name: S.decodeSync(NonEmptyString100)(name),
    });
  };
  
  // Update a wallet using Evolu mutation
  const updateWallet = (id: WalletId, name: string) => {
    update("wallet", { 
      id,
      name: S.decodeSync(NonEmptyString100)(name),
    });
  };
  
  // "Delete" a wallet by setting isDeleted flag
  const deleteWallet = (id: WalletId) => {
    update("wallet", { id, isDeleted: true });
  };
  
  return {
    getWallets,
    addWallet,
    updateWallet,
    deleteWallet
  };
};

// Category operations hook - updated to use Evolu
export const useCategories = () => {
  // Use Evolu hooks
  const { create, update } = useEvolu<Database>();
  
  // Get categories using Evolu query
  const getCategories = () => {
    return useQuery(categoriesQuery);
  };
  
  // Add a category using Evolu mutation
  const addCategory = (name: string, type: 'income' | 'expense') => {
    return create("category", {
      name: S.decodeSync(NonEmptyString100)(name),
      type
    });
  };
  
  // Update a category using Evolu mutation
  const updateCategory = (id: CategoryId, name: string, type: 'income' | 'expense') => {
    update("category", {
      id,
      name: S.decodeSync(NonEmptyString100)(name),
      type
    });
  };
  
  // "Delete" a category by setting isDeleted flag
  const deleteCategory = (id: CategoryId) => {
    update("category", { id, isDeleted: true });
  };
  
  return {
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory
  };
};

// Entry (Transaction) operations hook - updated to use Evolu
export const useEntries = () => {
  // Use Evolu hooks
  const { create, update } = useEvolu<Database>();
  
  // Get entries using Evolu query
  const getEntries = () => {
    return useQuery(entriesQuery);
  };
  
  // Get entries with additional details
  const getEntriesWithDetails = () => {
    return useQuery(entriesWithDetailsQuery);
  };
  
  // Add an entry using Evolu mutation
  const addEntry = (entry: {
    type: 'income' | 'expense' | 'transfer' | 'topup';
    amount: number;
    currency: string;
    description?: string;
    categoryId?: CategoryId;
    walletId: WalletId;
    date: string;
    toWalletId?: WalletId;
    receivedAmount?: number;
    receivedCurrency?: string;
  }) => {
    // Prepare entry for Evolu with proper validation
    const entryData = {
      type: entry.type,
      amount: entry.amount,
      currency: S.decodeSync(Currency)(entry.currency),
      description: entry.description ? S.decodeSync(NonEmptyString1000)(entry.description) : null,
      categoryId: entry.categoryId || null,
      walletId: entry.walletId,
      date: entry.date,
      toWalletId: entry.toWalletId || null,
      receivedAmount: entry.receivedAmount || null,
      receivedCurrency: entry.receivedCurrency ? S.decodeSync(Currency)(entry.receivedCurrency) : null
    };
    
    return create("entry", entryData);
  };
  
  // Update an entry using Evolu mutation
  const updateEntry = (id: EntryId, updates: Partial<{
    type: 'income' | 'expense' | 'transfer' | 'topup';
    amount: number;
    currency: string;
    description: string;
    categoryId: CategoryId;
    walletId: WalletId;
    date: string;
    toWalletId: WalletId;
    receivedAmount: number;
    receivedCurrency: string;
  }>) => {
    // Prepare update data with proper validation for string fields
    const updateData: any = { id };
    
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.currency !== undefined) updateData.currency = S.decodeSync(Currency)(updates.currency);
    if (updates.description !== undefined) updateData.description = updates.description ? S.decodeSync(NonEmptyString1000)(updates.description) : null;
    if (updates.categoryId !== undefined) updateData.categoryId = updates.categoryId || null;
    if (updates.walletId !== undefined) updateData.walletId = updates.walletId;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.toWalletId !== undefined) updateData.toWalletId = updates.toWalletId || null;
    if (updates.receivedAmount !== undefined) updateData.receivedAmount = updates.receivedAmount || null;
    if (updates.receivedCurrency !== undefined) updateData.receivedCurrency = updates.receivedCurrency ? S.decodeSync(Currency)(updates.receivedCurrency) : null;
    
    update("entry", updateData);
  };
  
  // "Delete" an entry by setting isDeleted flag
  const deleteEntry = (id: EntryId) => {
    update("entry", { id, isDeleted: true });
  };
  
  return {
    getEntries,
    getEntriesWithDetails,
    addEntry,
    updateEntry,
    deleteEntry
  };
}; 

export const useSettings = () => {
  // Use Evolu hooks
  const { create, update } = useEvolu<Database>();

  // Get wallets using Evolu query
  const getSettings = () => {
    return useQuery(settingsQuery);
  };
  

  // Add a wallet using Evolu mutation
  const addSetting = (key: string, value: any) => {
    return create("settings", {
      key: S.decodeSync(NonEmptyString100)(key),
      value: S.decodeSync(S.Any)(value),
    });
  };

  // Update a wallet using Evolu mutation
  const updateSetting = (id: SettingsId, key: string, value: any) => {
    update("settings", {
      id,
      key: S.decodeSync(NonEmptyString100)(key),
      value: S.decodeSync(S.Any)(value),
    });
  };

  // "Delete" a wallet by setting isDeleted flag
  const deleteSetting = (id: SettingsId) => {
    update("settings", { id, isDeleted: true });
  };

  return {
    getSettings,
    addSetting,
    updateSetting,
    deleteSetting
  };
};