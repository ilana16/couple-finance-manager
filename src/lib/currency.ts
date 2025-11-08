/**
 * Currency conversion utilities using exchangerate.host API (free, no key required)
 */

interface ExchangeRates {
  [currency: string]: number;
}

interface ConversionResult {
  amount: number;
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

// Cache exchange rates for 1 hour
let ratesCache: { rates: ExchangeRates; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch latest exchange rates from exchangerate.host
 * Base currency is EUR by default
 */
export async function fetchExchangeRates(baseCurrency: string = "ILS"): Promise<ExchangeRates> {
  // Check cache
  if (ratesCache && Date.now() - ratesCache.timestamp < CACHE_DURATION) {
    return ratesCache.rates;
  }

  try {
    const response = await fetch(`https://api.exchangerate.host/latest?base=${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.rates) {
      throw new Error("Invalid response from exchange rate API");
    }

    // Cache the rates
    ratesCache = {
      rates: data.rates,
      timestamp: Date.now()
    };

    return data.rates;
  } catch (error) {
    console.error("[Currency] Failed to fetch exchange rates:", error);
    
    // Return fallback rates if API fails
    return getFallbackRates();
  }
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<ConversionResult> {
  if (fromCurrency === toCurrency) {
    return {
      amount,
      from: fromCurrency,
      to: toCurrency,
      rate: 1,
      timestamp: new Date()
    };
  }

  try {
    // Fetch rates with fromCurrency as base
    const rates = await fetchExchangeRates(fromCurrency);
    const rate = rates[toCurrency];

    if (!rate) {
      throw new Error(`Exchange rate not found for ${toCurrency}`);
    }

    return {
      amount: amount * rate,
      from: fromCurrency,
      to: toCurrency,
      rate,
      timestamp: new Date()
    };
  } catch (error) {
    console.error("[Currency] Conversion failed:", error);
    throw error;
  }
}

/**
 * Get exchange rate between two currencies
 */
export async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) return 1;

  const rates = await fetchExchangeRates(fromCurrency);
  return rates[toCurrency] || 1;
}

/**
 * Get multiple exchange rates for a base currency
 */
export async function getMultipleRates(
  baseCurrency: string,
  targetCurrencies: string[]
): Promise<Record<string, number>> {
  const rates = await fetchExchangeRates(baseCurrency);
  const result: Record<string, number> = {};

  for (const currency of targetCurrencies) {
    result[currency] = rates[currency] || 1;
  }

  return result;
}

/**
 * Fallback exchange rates (approximate, for when API fails)
 */
function getFallbackRates(): ExchangeRates {
  return {
    "ILS": 1,
    "USD": 0.27,
    "EUR": 0.25,
    "GBP": 0.21,
    "JPY": 40.5,
    "CNY": 1.95,
    "AUD": 0.42,
    "CAD": 0.38,
    "CHF": 0.24,
    "INR": 22.5
  };
}

/**
 * List of supported currencies
 */
export const SUPPORTED_CURRENCIES = [
  { code: "ILS", name: "Israeli Shekel", symbol: "₪" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" }
];

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}
