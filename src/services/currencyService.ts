// Currency conversion service using ExchangeRate-API
// Caches rates to minimize API calls

const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with actual API key from exchangerate-api.com
const BASE_CURRENCY = 'ILS'; // Israeli Shekel (NIS)
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface ExchangeRates {
  base_code: string;
  conversion_rates: { [key: string]: number };
  time_last_update_unix: number;
}

interface CachedRates {
  rates: ExchangeRates;
  timestamp: number;
}

// Cache key for localStorage
const CACHE_KEY = 'currency_exchange_rates';

/**
 * Fetch exchange rates from API
 */
async function fetchExchangeRates(): Promise<ExchangeRates> {
  const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${BASE_CURRENCY}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.result !== 'success') {
      throw new Error(`API error: ${data['error-type'] || 'Unknown error'}`);
    }
    
    return {
      base_code: data.base_code,
      conversion_rates: data.conversion_rates,
      time_last_update_unix: data.time_last_update_unix
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
}

/**
 * Get cached rates from localStorage
 */
function getCachedRates(): CachedRates | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const cachedData: CachedRates = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - cachedData.timestamp < CACHE_DURATION) {
      return cachedData;
    }
    
    return null;
  } catch (error) {
    console.error('Error reading cached rates:', error);
    return null;
  }
}

/**
 * Save rates to localStorage cache
 */
function cacheRates(rates: ExchangeRates): void {
  try {
    const cachedData: CachedRates = {
      rates,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
  } catch (error) {
    console.error('Error caching rates:', error);
  }
}

/**
 * Get exchange rates (from cache or API)
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  // Try to get from cache first
  const cached = getCachedRates();
  if (cached) {
    console.log('Using cached exchange rates');
    return cached.rates;
  }
  
  // Fetch from API if cache is invalid or missing
  console.log('Fetching fresh exchange rates from API');
  const rates = await fetchExchangeRates();
  cacheRates(rates);
  return rates;
}

/**
 * Convert amount from one currency to another
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency code (e.g., 'USD')
 * @param toCurrency - Target currency code (e.g., 'ILS')
 * @returns Converted amount
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string = BASE_CURRENCY
): Promise<number> {
  // If same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  try {
    const rates = await getExchangeRates();
    
    // If converting from base currency (ILS)
    if (fromCurrency === BASE_CURRENCY) {
      const rate = rates.conversion_rates[toCurrency];
      if (!rate) {
        throw new Error(`Exchange rate not found for ${toCurrency}`);
      }
      return amount * rate;
    }
    
    // If converting to base currency (ILS)
    if (toCurrency === BASE_CURRENCY) {
      const rate = rates.conversion_rates[fromCurrency];
      if (!rate) {
        throw new Error(`Exchange rate not found for ${fromCurrency}`);
      }
      // To convert to base currency, divide by the rate
      return amount / rate;
    }
    
    // Converting between two non-base currencies
    // First convert to base, then to target
    const fromRate = rates.conversion_rates[fromCurrency];
    const toRate = rates.conversion_rates[toCurrency];
    
    if (!fromRate || !toRate) {
      throw new Error(`Exchange rate not found for ${fromCurrency} or ${toCurrency}`);
    }
    
    const amountInBase = amount / fromRate;
    return amountInBase * toRate;
  } catch (error) {
    console.error('Error converting currency:', error);
    // Return original amount as fallback
    return amount;
  }
}

/**
 * Convert amount to NIS (Israeli Shekel)
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency code
 * @returns Amount in NIS
 */
export async function convertToNIS(amount: number, fromCurrency: string): Promise<number> {
  return convertCurrency(amount, fromCurrency, BASE_CURRENCY);
}

/**
 * Get exchange rate for a specific currency pair
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Exchange rate
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string = BASE_CURRENCY
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1;
  }
  
  try {
    const rates = await getExchangeRates();
    
    if (fromCurrency === BASE_CURRENCY) {
      return rates.conversion_rates[toCurrency] || 1;
    }
    
    if (toCurrency === BASE_CURRENCY) {
      const rate = rates.conversion_rates[fromCurrency];
      return rate ? 1 / rate : 1;
    }
    
    const fromRate = rates.conversion_rates[fromCurrency];
    const toRate = rates.conversion_rates[toCurrency];
    
    if (!fromRate || !toRate) {
      return 1;
    }
    
    return toRate / fromRate;
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    return 1;
  }
}

/**
 * Format currency amount with symbol
 * @param amount - Amount to format
 * @param currency - Currency code
 * @returns Formatted string with currency symbol
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbols: { [key: string]: string } = {
    ILS: '₪',
    NIS: '₪',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
    CHF: 'CHF'
  };
  
  const symbol = symbols[currency] || currency;
  const formatted = amount.toFixed(2);
  
  // For currencies like USD, EUR, GBP - symbol before amount
  if (['USD', 'EUR', 'GBP', 'CAD', 'AUD'].includes(currency)) {
    return `${symbol}${formatted}`;
  }
  
  // For ILS, NIS, JPY, CHF - symbol after amount
  return `${formatted} ${symbol}`;
}

/**
 * Get last update time of exchange rates
 * @returns Date of last update or null if no cached data
 */
export function getLastUpdateTime(): Date | null {
  const cached = getCachedRates();
  if (!cached) return null;
  
  return new Date(cached.rates.time_last_update_unix * 1000);
}

/**
 * Clear cached exchange rates (force refresh on next request)
 */
export function clearRatesCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' }
];
