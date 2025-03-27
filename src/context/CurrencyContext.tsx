import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { useSettings } from '@/evolu/EvoluContext';
import { Settings } from '@/types';
type Currency = string;

interface CurrencyContextType {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  convertAmount: (amount: number, fromCurrency: Currency) => number;
  availableCurrencies: Currency[];
  setEnabledCurrencies: (currencies: string[]) => void;
  allCurrencies: Currency[];
  exchangeRates: Record<string, number>;
  isLoading: boolean;
  isOffline: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Base exchange rate for USD (always 1)
const BASE_USD_RATE = 1;

// Local storage keys
const STORAGE_KEYS = {
  EXCHANGE_RATES: 'exchange_rates',
  LAST_UPDATE: 'exchange_rates_last_update',
  CURRENCIES: 'available_currencies'
} as const;

// Cache duration in milliseconds (24 hours)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const evoluSettings = useSettings();
  const { rows: settingsData = [] } = evoluSettings.getSettings();
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: BASE_USD_RATE });
  const [allCurrencies, setAllCurrencies] = useState<Currency[]>(['USD']);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Cast the readonly arrays to mutable arrays to satisfy the interface
  const settings = settingsData as unknown as Settings[];

  // Load cached data from localStorage
  const loadCachedData = useCallback(() => {
    try {
      const cachedRates = localStorage.getItem(STORAGE_KEYS.EXCHANGE_RATES);
      const lastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
      const cachedCurrencies = localStorage.getItem(STORAGE_KEYS.CURRENCIES);

      if (cachedRates && lastUpdate && cachedCurrencies) {
        const lastUpdateTime = parseInt(lastUpdate);
        const now = Date.now();

        // Check if cache is still valid
        if (now - lastUpdateTime < CACHE_DURATION) {
          setExchangeRates(JSON.parse(cachedRates));
          setAllCurrencies(JSON.parse(cachedCurrencies));
          return true;
        }
      }
    } catch (error) {
      console.error('Error loading cached exchange rates:', error);
    }
    return false;
  }, []);

  // Save data to localStorage
  const saveToCache = useCallback((rates: Record<string, number>, currencies: Currency[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXCHANGE_RATES, JSON.stringify(rates));
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString());
      localStorage.setItem(STORAGE_KEYS.CURRENCIES, JSON.stringify(currencies));
    } catch (error) {
      console.error('Error saving exchange rates to cache:', error);
    }
  }, []);

  // Fetch exchange rates from API
  const fetchExchangeRates = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      
      // Get all available currencies and their rates
      const rates: Record<string, number> = {
        USD: BASE_USD_RATE,
        ...data.rates
      };
      
      // Get all currency codes
      const currencies = Object.keys(rates);
      
      setExchangeRates(rates);
      setAllCurrencies(currencies);
      saveToCache(rates, currencies);
      setIsOffline(false);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // If API fails, try to load from cache
      const hasCachedData = loadCachedData();
      setIsOffline(!hasCachedData);
    } finally {
      setIsLoading(false);
    }
  }, [loadCachedData, saveToCache]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      fetchExchangeRates();
    };

    const handleOffline = () => {
      setIsOffline(true);
      loadCachedData();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchExchangeRates, loadCachedData]);

  // Initial load and periodic updates
  useEffect(() => {
    // Try to load cached data first
    const hasCachedData = loadCachedData();
    
    // If we have cached data and we're offline, use it
    if (hasCachedData && !navigator.onLine) {
      setIsOffline(true);
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch fresh data
    fetchExchangeRates();
    const interval = setInterval(fetchExchangeRates, 60 * 60 * 1000); // Update every hour
    return () => clearInterval(interval);
  }, [fetchExchangeRates, loadCachedData]);

  const getSelectedCurrency = useCallback(() => {
    let selectedCurrency = 'USD';
    const selectedCurrencySetting = settings.find((setting) => setting.key === 'selectedCurrency');
    if (selectedCurrencySetting) {
      selectedCurrency = selectedCurrencySetting.value;
    }
    return selectedCurrency;
  }, [settings]);

  const getEnabledCurrencies = useCallback(() => {
    // by default only USD is enabled
    let enabledCurrencies = ['USD'];
    const enabledCurrenciesSetting = settings.find((setting) => setting.key === 'enabledCurrencies');
    if (enabledCurrenciesSetting) {
      if (Array.isArray(enabledCurrenciesSetting.value)) {
        enabledCurrencies = enabledCurrenciesSetting.value;
      } else if (enabledCurrenciesSetting?.value.startsWith('[')) {
        // convert from json to array
        enabledCurrencies = JSON.parse(enabledCurrenciesSetting.value);
      } else {
        enabledCurrencies = enabledCurrenciesSetting.value.split(',').map(c => c.trim());
      }
    }
    return enabledCurrencies;
  }, [settings]);

  const setEnabledCurrencies = (currencies: string[]) => {
    // first get the settings id.
    const targetResult = settings.find((setting) => setting.key === 'enabledCurrencies');
    if (!targetResult) {
      // create as new setting
      const toset = JSON.stringify(currencies);
      evoluSettings.addSetting('enabledCurrencies', toset);
    }
    else {
      const {id} = targetResult;
      evoluSettings.updateSetting(id, 'enabledCurrencies', JSON.stringify(currencies));
    }
  };

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
    const amountInUSD = amount / exchangeRates[fromCurrency];
    return amountInUSD * exchangeRates[selectedCurrency];
  };

  const selectedCurrency = getSelectedCurrency();

  return (
    <CurrencyContext.Provider value={{ 
      selectedCurrency, 
      setSelectedCurrency, 
      convertAmount, 
      availableCurrencies: getEnabledCurrencies(),
      setEnabledCurrencies,
      allCurrencies,
      exchangeRates,
      isLoading,
      isOffline
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