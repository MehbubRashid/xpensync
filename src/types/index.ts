export type Currency = string;

export type EntryType = 'income' | 'expense' | 'topup' | 'transfer';
export type ChartEntryType = 'income' | 'expense' | 'balance';

export interface Category {
  id: string;
  name: string;
  type: EntryType;
}

export interface Entry {
  id: string;
  type: 'income' | 'expense' | 'topup' | 'transfer';
  amount: number;
  currency: string;
  description: string;
  categoryId: string;
  walletId: string;
  date: string;
  // Transfer-specific fields
  toWalletId?: string;
  receivedAmount?: number;
  receivedCurrency?: string;
}

export type TimeGrouping = 'daily' | 'monthly' | 'yearly';

export interface EntryFilters {
  type: EntryType | 'all';
  categoryId: string | null;
  walletId: string | null;
}

export interface ChartFilters {
  timeGrouping: TimeGrouping;
  entryType: ChartEntryType;
  categoryId?: string;
  walletId?: string;
}

export interface ChartData {
  date: string;
  income: number;
  expense: number;
  balance: number;
  currency: Currency;
}

export interface Wallet {
  id: string;
  name: string;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
}
