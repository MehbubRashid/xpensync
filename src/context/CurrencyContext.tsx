import React, { createContext, useCallback, useContext, useState } from 'react';
import { useSettings } from '@/evolu/EvoluContext';
import { Settings } from '@/types';
type Currency = string;

interface CurrencyContextType {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  convertAmount: (amount: number, fromCurrency: Currency) => number;
  availableCurrencies: Currency[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Exchange rate (1 USD = 110 BDT)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  BDT: 110, // (1 USD = 110 BDT)
  USDT: 1,  // 1:1 with USD
};

// Get available currencies from exchange rates
const AVAILABLE_CURRENCIES = Object.keys(EXCHANGE_RATES) as Currency[];

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const evoluSettings = useSettings();
  const { rows: settingsData = [] } = evoluSettings.getSettings();

  // Cast the readonly arrays to mutable arrays to satisfy the interface
  const settings = settingsData as unknown as Settings[];

  
  const getSelectedCurrency = useCallback(() => {
    let selectedCurrency = 'USD';
    const selectedCurrencySetting = settings.find((setting) => setting.key === 'selectedCurrency');
    if (selectedCurrencySetting) {
      selectedCurrency = selectedCurrencySetting.value;
    }
    return selectedCurrency;
  }, [settings]);


  const setSelectedCurrency = (currency: string) => {
    // first get the settings id.
    const targetResult = settings.find((setting) => setting.key === 'selectedCurrency');
    if (!targetResult) {
      // create as new setting
      evoluSettings.addSetting('selectedCurrency', currency);
    }
    else {
      const {id} = targetResult;
      evoluSettings.updateSetting(id, 'selectedCurrency', currency);
    }
  };

  const convertAmount = (amount: number, fromCurrency: Currency): number => {
    if (fromCurrency === selectedCurrency) return amount;
    
    // Convert to USD first, then to target currency
    const amountInUSD = amount / EXCHANGE_RATES[fromCurrency];
    return amountInUSD * EXCHANGE_RATES[selectedCurrency];
  };

  const selectedCurrency = getSelectedCurrency();



  return (
    <CurrencyContext.Provider value={{ 
      selectedCurrency, 
      setSelectedCurrency, 
      convertAmount, 
      availableCurrencies: AVAILABLE_CURRENCIES
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}; 