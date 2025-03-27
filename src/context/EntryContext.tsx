import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Entry, Category, EntryType, ChartEntryType, TimeGrouping, EntryFilters, ChartFilters, ChartData, Wallet, Currency } from '@/types';
import { format, parse, isBefore, startOfMonth, startOfYear, startOfDay, endOfDay, endOfMonth, endOfYear, isWithinInterval, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { toast } from 'sonner';
import { useCurrency } from './CurrencyContext';
import { 
  useWallets as useEvoluWallets, 
  useCategories as useEvoluCategories, 
  useEntries as useEvoluEntries,
  EvoluErrorNotification
} from '@/evolu/EvoluContext';
import { WalletId, CategoryId, EntryId } from '@/evolu/schema';

export interface EntryContextType {
  entries: Entry[];
  categories: Category[];
  wallets: Wallet[];
  addEntry: (entry: Omit<Entry, 'id'>) => void;
  addCategory: (category: Omit<Category, 'id'>) => Category;
  addWallet: (wallet: Omit<Wallet, 'id'>) => Wallet;
  editCategory: (id: CategoryId, updates: Partial<Omit<Category, 'id'>>) => void;
  editWallet: (id: WalletId, updates: Partial<Omit<Wallet, 'id'>>) => void;
  deleteEntry: (id: EntryId) => void;
  deleteCategory: (id: CategoryId) => void;
  deleteWallet: (id: WalletId) => void;
  filters: EntryFilters;
  setFilters: React.Dispatch<React.SetStateAction<EntryFilters>>;
  chartFilters: ChartFilters;
  setChartFilters: React.Dispatch<React.SetStateAction<ChartFilters>>;
  timeGrouping: TimeGrouping;
  setTimeGrouping: React.Dispatch<React.SetStateAction<TimeGrouping>>;
  getChartData: () => ChartData[];
  getFilteredEntries: () => Entry[];
  getCategoryById: (id: CategoryId) => Category | undefined;
  getEntriesByDate: () => Record<string, Entry[]>;
  getWalletById: (id: WalletId) => Wallet | undefined;
}

const EntryContext = createContext<EntryContextType | undefined>(undefined);

export const EntryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get the Evolu hooks
  const evoluWallets = useEvoluWallets();
  const evoluCategories = useEvoluCategories();
  const evoluEntries = useEvoluEntries();
  
  // Fetch the data using Evolu queries and cast to the expected types
  const { rows: walletsData = [] } = evoluWallets.getWallets();
  const { rows: categoriesData = [] } = evoluCategories.getCategories();
  const { rows: entriesData = [] } = evoluEntries.getEntries();
  
  // Cast the readonly arrays to mutable arrays to satisfy the interface
  const wallets = walletsData as unknown as Wallet[];
  const categories = categoriesData as unknown as Category[];
  const entries = entriesData as unknown as Entry[];

  const [filters, setFilters] = useState<EntryFilters>({
    type: 'all',
    categoryId: null,
    walletId: null,
  });

  const [timeGrouping, setTimeGrouping] = useState<TimeGrouping>('monthly');

  const [chartFilters, setChartFilters] = useState<ChartFilters>({
    timeGrouping: 'daily',
    entryType: 'balance'
  });

  const { convertAmount, selectedCurrency } = useCurrency();

  const addEntry = (entry: Omit<Entry, 'id'>) => {
    // Use Evolu to add the entry
    const result = evoluEntries.addEntry(entry as any);
    toast.success(entry.type === 'transfer' ? 'Transfer completed successfully' : 'Entry added successfully');
  };

  const deleteEntry = (id: EntryId) => {
    // Use Evolu to delete the entry
    evoluEntries.deleteEntry(id);
  };

  const deleteCategory = (id: CategoryId) => {
    // First, check if category is being used by any entries
    const isUsed = entries.some(entry => entry.categoryId === id);
    if (isUsed) {
      // If category is being used, update those entries to remove the category
      entries.filter(entry => entry.categoryId === id).forEach(entry => {
        evoluEntries.updateEntry(entry.id as EntryId, { categoryId: null as any });
      });
    }
    
    // Use Evolu to delete the category
    evoluCategories.deleteCategory(id);
    toast.success('Category deleted successfully');
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    // We need to ensure that the type is either 'income' or 'expense'
    const type = category.type === 'income' || category.type === 'expense' 
      ? category.type 
      : 'expense'; // Default to expense if it's not income or expense
      
    // Use Evolu to add the category
    const result = evoluCategories.addCategory(category.name, type);
    toast.success('Category added successfully');
    
    // Return the category with its new ID
    return { ...category, id: result.id as string };
  };

  const getCategoryById = (id: CategoryId) => {
    return categories.find((category) => category.id === id);
  };

  const getFilteredEntries = () => {
    return entries.filter((entry) => {
      // Filter by entry type
      if (filters.type !== 'all' && entry.type !== filters.type) {
        return false;
      }
      
      // Filter by category
      if (filters.categoryId && entry.categoryId !== filters.categoryId) {
        return false;
      }

      // Filter by wallet
      if (filters.walletId && entry.walletId !== filters.walletId) {
        return false;
      }
      
      return true;
    });
  };

  const getEntriesByDate = () => {
    // Group entries by date
    const filteredEntries = getFilteredEntries();
    return filteredEntries.reduce((acc, entry) => {
      const date = entry.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(entry);
      return acc;
    }, {} as Record<string, Entry[]>);
  };

  const getChartData = () => {
    const { timeGrouping, categoryId, entryType, walletId } = chartFilters;
    const { convertAmount, selectedCurrency } = useCurrency();
    
    // Find the first and last entry dates
    const entryDates = entries.map(entry => new Date(entry.date));
    const firstEntryDate = entryDates.length > 0 ? startOfDay(Math.min(...entryDates.map(d => d.getTime()))) : new Date();
    const lastEntryDate = entryDates.length > 0 ? endOfDay(Math.max(...entryDates.map(d => d.getTime()))) : new Date();

    // Determine the date range based on time grouping
    let startDate: Date;
    let endDate: Date;

    switch (timeGrouping) {
      case 'daily':
        startDate = firstEntryDate;
        endDate = lastEntryDate;
        break;
      case 'monthly':
        startDate = startOfMonth(firstEntryDate);
        endDate = endOfMonth(lastEntryDate);
        break;
      case 'yearly':
        startDate = startOfYear(firstEntryDate);
        endDate = endOfYear(lastEntryDate);
        break;
      default:
        startDate = firstEntryDate;
        endDate = lastEntryDate;
    }

    // Generate date points based on time grouping
    const datePoints: Date[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      datePoints.push(new Date(currentDate));
      switch (timeGrouping) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }

    // Calculate data for each date point
    return datePoints.map(date => {
      // Get entries for this specific date/period
      let periodEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        switch (timeGrouping) {
          case 'daily':
            return (
              entryDate.getFullYear() === date.getFullYear() &&
              entryDate.getMonth() === date.getMonth() &&
              entryDate.getDate() === date.getDate()
            );
          case 'monthly':
            return (
              entryDate.getFullYear() === date.getFullYear() &&
              entryDate.getMonth() === date.getMonth()
            );
          case 'yearly':
            return entryDate.getFullYear() === date.getFullYear();
          default:
            return false;
        }
      });

      // Filter entries by category if selected
      if (categoryId && categoryId !== 'all') {
        periodEntries = periodEntries.filter(entry => entry.categoryId === categoryId);
      }

      // Filter entries by wallet if selected
      if (walletId) {
        periodEntries = periodEntries.filter(entry => entry.walletId === walletId);
      }

      // Calculate totals using CurrencyContext
      const totals = periodEntries.reduce((acc, entry) => {
        const convertedAmount = convertAmount(entry.amount, entry.currency as Currency);
        // For income charts, only include income type (not topup)
        if (entry.type === 'income') {
          acc.income += convertedAmount;
        } else if (entry.type === 'expense') {
          acc.expense += convertedAmount;
        }
        // Note: topup transactions are not included in income/expense charts
        return acc;
      }, { income: 0, expense: 0 });

      // Calculate balance up to this date
      let balanceEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        
        // Handle date comparison based on time grouping
        switch (timeGrouping) {
          case 'daily':
            // Compare normalized dates (removing time component)
            const normalizedEntryDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
            const normalizedCurrentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            return normalizedEntryDate <= normalizedCurrentDate;
            
          case 'monthly':
            // For monthly, include entries if they're in or before the selected month
            return (
              entryDate.getFullYear() < date.getFullYear() || 
              (entryDate.getFullYear() === date.getFullYear() && 
              entryDate.getMonth() <= date.getMonth())
            );
            
          case 'yearly':
            // For yearly, include entries if they're in or before the selected year
            return entryDate.getFullYear() <= date.getFullYear();
            
          default:
            return false;
        }
      });

      // Filter balance entries by wallet if selected
      if (walletId) {
        balanceEntries = balanceEntries.filter(entry => entry.walletId === walletId);
      }
      
      // Calculate balance for each wallet and sum them up
      const walletBalances = wallets
        .filter(wallet => !walletId || wallet.id === walletId) // Filter wallets if one is selected
        .map(wallet => {
          // Get entries for this wallet up to this date
          const walletEntries = balanceEntries.filter(entry => 
            entry.walletId === wallet.id || (entry.type === 'transfer' && entry.toWalletId === wallet.id)
          );
          
          // Calculate income and expense totals for this wallet
          const walletTotals = walletEntries.reduce((acc, entry) => {
            const convertedAmount = convertAmount(
              entry.type === 'transfer' && entry.toWalletId === wallet.id 
                ? (entry.receivedAmount || entry.amount) 
                : entry.amount, 
              entry.type === 'transfer' && entry.toWalletId === wallet.id 
                ? (entry.receivedCurrency as Currency || entry.currency as Currency) 
                : entry.currency as Currency
            );
            
            // For balance calculation:
            if (entry.type === 'income' || entry.type === 'topup') {
              // Income and topup transactions add to balance
              acc.income += convertedAmount;
            } else if (entry.type === 'expense') {
              // Expense transactions subtract from balance
              acc.expense += convertedAmount;
            } else if (entry.type === 'transfer') {
              if (entry.walletId === wallet.id) {
                // Outgoing transfer from this wallet (subtract)
                acc.expense += convertedAmount;
              }
              if (entry.toWalletId === wallet.id) {
                // Incoming transfer to this wallet (add)
                acc.income += convertedAmount;
              }
            }
            return acc;
          }, { income: 0, expense: 0 });
          
          // Wallet balance = income (including topups) - expense
          return walletTotals.income - walletTotals.expense;
        });

      // Sum up all wallet balances to get the total balance
      const totalBalance = walletBalances.reduce((sum, balance) => sum + balance, 0);

      // Format date based on time grouping
      const formattedDate = (() => {
        switch (timeGrouping) {
          case 'daily':
            return format(date, 'MMM d');
          case 'monthly':
            return format(date, 'MMM yyyy');
          case 'yearly':
            return format(date, 'yyyy');
          default:
            return format(date, 'MMM d');
        }
      })();

      return {
        date: formattedDate,
        income: totals.income,
        expense: totals.expense,
        balance: totalBalance,
        currency: selectedCurrency
      };
    });
  };

  const editCategory = (id: CategoryId, updates: Partial<Omit<Category, 'id'>>) => {
    // We need to ensure that the type is either 'income' or 'expense'
    if (updates.type) {
      const type = updates.type === 'income' || updates.type === 'expense'
        ? updates.type
        : 'expense'; // Default to expense if it's not income or expense
        
      evoluCategories.updateCategory(id, updates.name || '', type);
    } else if (updates.name) {
      // Only update the name if type is not provided
      const category = categories.find(c => c.id === id);
      if (category) {
        evoluCategories.updateCategory(id, updates.name, category.type as 'income' | 'expense');
      }
    }
    
    toast.success('Category updated successfully');
  };

  const addWallet = (wallet: Omit<Wallet, 'id'>): Wallet => {
    // Use Evolu to add the wallet
    const result = evoluWallets.addWallet(wallet.name);
    toast.success('Wallet created successfully');
    return { ...wallet, id: result.id as string };
  };

  const editWallet = (id: WalletId, updates: Partial<Omit<Wallet, 'id'>>) => {
    // Use Evolu to update the wallet
    if (updates.name) {
      evoluWallets.updateWallet(id, updates.name);
    }
    
    toast.success('Wallet updated successfully');
  };

  const deleteWallet = (id: WalletId) => {
    // Use Evolu to delete the wallet
    evoluWallets.deleteWallet(id);
    toast.success('Wallet deleted successfully');
  };

  const getWalletById = useCallback((id: WalletId) => {
    return wallets.find(wallet => wallet.id === id);
  }, [wallets]);

  return (
    <>
      <EvoluErrorNotification />
    <EntryContext.Provider
      value={{
        entries,
        categories,
          wallets,
        addEntry,
        addCategory,
          addWallet,
          editCategory,
          editWallet,
        deleteEntry,
          deleteCategory,
          deleteWallet,
          getEntriesByDate,
          getCategoryById,
          getWalletById,
        filters,
        setFilters,
        chartFilters,
        setChartFilters,
        timeGrouping,
        setTimeGrouping,
        getChartData,
        getFilteredEntries,
      }}
    >
      {children}
    </EntryContext.Provider>
    </>
  );
};

export const useEntry = () => {
  const context = useContext(EntryContext);
  if (context === undefined) {
    throw new Error('useEntry must be used within an EntryProvider');
  }
  return context;
};
