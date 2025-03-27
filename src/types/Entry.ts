export type Currency = 'USD' | 'BDT';

export interface Entry {
  id: string;
  amount: number;
  currency: Currency;
  description: string;
  date: string;
  category: string;
} 