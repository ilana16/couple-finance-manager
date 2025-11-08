// Currency utility functions

export type Currency = 'NIS' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  NIS: '₪',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: '$',
  AUD: '$',
  CHF: 'CHF',
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  NIS: 'Israeli Shekel',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CHF: 'Swiss Franc',
};

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

export function formatCurrency(amount: number, currency: Currency): string {
  const symbol = getCurrencySymbol(currency);
  const formatted = amount.toFixed(2);
  
  // For currencies that use symbol after amount
  if (currency === 'CHF') {
    return `${formatted} ${symbol}`;
  }
  
  // For most currencies, symbol comes before
  return `${symbol}${formatted}`;
}

// Exchange rates (base: USD)
// These are approximate rates - in production, use a real-time API
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1.0,
  NIS: 3.65,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  CAD: 1.36,
  AUD: 1.52,
  CHF: 0.88,
};

// Convert amount from one currency to another
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to USD first, then to target currency
  const amountInUSD = amount / EXCHANGE_RATES[fromCurrency];
  const convertedAmount = amountInUSD * EXCHANGE_RATES[toCurrency];
  
  return convertedAmount;
}

// Fetch live exchange rates from API (optional)
export async function fetchExchangeRates(): Promise<Record<Currency, number> | null> {
  try {
    // Using exchangerate-api.com (free tier: 1,500 requests/month)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    
    if (data && data.rates) {
      return {
        USD: 1.0,
        NIS: data.rates.ILS || EXCHANGE_RATES.NIS,
        EUR: data.rates.EUR || EXCHANGE_RATES.EUR,
        GBP: data.rates.GBP || EXCHANGE_RATES.GBP,
        JPY: data.rates.JPY || EXCHANGE_RATES.JPY,
        CAD: data.rates.CAD || EXCHANGE_RATES.CAD,
        AUD: data.rates.AUD || EXCHANGE_RATES.AUD,
        CHF: data.rates.CHF || EXCHANGE_RATES.CHF,
      };
    }
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
  }
  
  return null;
}

// Update exchange rates in memory
let cachedRates: Record<Currency, number> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 3600000; // 1 hour

export async function getExchangeRates(): Promise<Record<Currency, number>> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (cachedRates && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedRates;
  }
  
  // Fetch new rates
  const freshRates = await fetchExchangeRates();
  
  if (freshRates) {
    cachedRates = freshRates;
    lastFetchTime = now;
    return freshRates;
  }
  
  // Fall back to static rates
  return EXCHANGE_RATES;
}

// Convert with live rates
export async function convertCurrencyLive(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;
  
  const rates = await getExchangeRates();
  
  // Convert to USD first, then to target currency
  const amountInUSD = amount / rates[fromCurrency];
  const convertedAmount = amountInUSD * rates[toCurrency];
  
  return convertedAmount;
}
