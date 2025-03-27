import React from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { Currency } from '@/types';
import { EntryForm } from './EntryForm';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { FinancialSummary } from './FinancialSummary';
import { Settings } from './Settings';

export const Header: React.FC = () => {
  const { selectedCurrency, setSelectedCurrency, availableCurrencies } = useCurrency();

  return (
    <header className="pt-10 w-full flex flex-col items-center gap-4 animate-fade-in">
      <div className="flex justify-end items-center w-full mb-4">
        <div className="flex items-center gap-4">
          <Select
            value={selectedCurrency}
            onValueChange={(value) => setSelectedCurrency(value as Currency)}
          >
            <SelectTrigger className='border-0 shadow-none flex gap-1'>
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              {availableCurrencies.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <ThemeToggle />
        <Settings />
      </div>
      
      <div className="w-full">
        <EntryForm />
      </div>
      
      <div className="w-full mt-8">
        <FinancialSummary />
      </div>
    </header>
  );
};
