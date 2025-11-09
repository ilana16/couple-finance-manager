# Currency Conversion Setup Guide

This guide explains how to set up and use the multi-currency conversion feature in the Couple Finance Manager app.

## Overview

The app now supports transactions in multiple currencies (ILS, USD, EUR, GBP, JPY, CAD, AUD, CHF). All transactions are automatically converted to Israeli Shekels (ILS/NIS) for calculations while preserving the original currency for display.

## Setup Steps

### 1. Get an API Key from ExchangeRate-API

1. Visit [https://www.exchangerate-api.com/](https://www.exchangerate-api.com/)
2. Click "Get Free Key" button
3. Enter your email address
4. Confirm your email
5. Copy your API key from the dashboard

### 2. Add API Key to the App

Open `src/services/currencyService.ts` and replace the placeholder API key:

```typescript
const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your actual API key
```

With your actual API key:

```typescript
const API_KEY = 'abc123def456ghi789'; // Your real API key
```

### 3. Deploy the Updated App

```bash
# Commit the changes
git add .
git commit -m "Add currency conversion feature"
git push origin main
```

The app will automatically deploy to Netlify.

### 4. Run Migration for Existing Transactions

After deploying, you need to add the `amountInNIS` field to existing transactions:

1. Open the deployed app in your browser
2. Log in to your account
3. Open the browser console (F12 or right-click → Inspect → Console)
4. Run the migration command:

```javascript
// Import and run the migration
import('./scripts/migrateCurrencyConversion.js').then(m => m.migrateCurrencyConversion());
```

Or if the migration function is already loaded:

```javascript
window.runCurrencyMigration();
```

The migration will:
- Process all existing transactions
- Convert amounts to NIS based on current exchange rates
- Add the `amountInNIS` field to each transaction
- Display progress in the console

## How It Works

### Currency Conversion

1. **Transaction Entry**: When you add a transaction, select the currency from the dropdown
2. **Automatic Conversion**: The app automatically converts the amount to NIS using current exchange rates
3. **Storage**: Both the original amount/currency AND the converted NIS amount are stored
4. **Display**: Transactions show in their original currency
5. **Calculations**: All totals, budgets, and reports use the NIS amounts for accuracy

### Exchange Rate Caching

- Exchange rates are cached for 24 hours to minimize API calls
- The free tier allows 1,500 requests per month
- Rates update once per day (sufficient for personal finance tracking)
- Cache is stored in browser localStorage

### Supported Currencies

| Code | Currency | Symbol |
|------|----------|--------|
| ILS  | Israeli Shekel | ₪ |
| USD  | US Dollar | $ |
| EUR  | Euro | € |
| GBP  | British Pound | £ |
| JPY  | Japanese Yen | ¥ |
| CAD  | Canadian Dollar | CA$ |
| AUD  | Australian Dollar | A$ |
| CHF  | Swiss Franc | CHF |

## Features

### Multi-Currency Transactions

- Add transactions in any supported currency
- Original currency is preserved for reference
- Automatic conversion to NIS for calculations

### Accurate Financial Calculations

All calculations now use NIS amounts:
- **Dashboard**: Total income, expenses, and balance
- **Budgets**: Budget limits vs. spent amounts
- **Reports**: Category breakdowns and monthly trends
- **Savings Goals**: Goal contributions

### Currency Display

- Transaction lists show original currency
- Totals and calculations show in NIS (₪)
- Clear indication of which amounts are converted

## Troubleshooting

### API Key Issues

**Problem**: "API request failed" or "Invalid API key" errors

**Solution**:
1. Verify your API key is correct in `currencyService.ts`
2. Check that you confirmed your email with ExchangeRate-API
3. Ensure you haven't exceeded the free tier limit (1,500 requests/month)

### Migration Issues

**Problem**: Migration doesn't run or shows errors

**Solution**:
1. Check browser console for specific error messages
2. Ensure you're logged in and have internet connection
3. Try running the migration again (it skips already-migrated transactions)
4. If persistent, contact support

### Incorrect Conversions

**Problem**: Amounts seem wrong after conversion

**Solution**:
1. Clear the exchange rate cache: `localStorage.removeItem('currency_exchange_rates')`
2. Refresh the page to fetch new rates
3. Check that the correct currency was selected when adding the transaction

### Old Transactions Not Converting

**Problem**: Existing transactions don't have converted amounts

**Solution**:
- Run the migration script as described in step 4 above
- The migration only needs to be run once

## API Limits

### Free Tier
- 1,500 requests per month
- Updates once per day
- No credit card required

### Usage Optimization
- Exchange rates are cached for 24 hours
- Migration counts as one request per transaction
- Normal usage: ~30-50 requests per month (one per day + occasional cache clears)

## Future Enhancements

Potential improvements for the currency feature:
- [ ] Manual exchange rate override option
- [ ] Historical rate tracking
- [ ] Currency conversion history log
- [ ] Support for more currencies
- [ ] Cryptocurrency support
- [ ] Exchange rate alerts

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key is valid
3. Ensure you have internet connection
4. Try clearing the cache and refreshing

For additional help, open an issue on GitHub or contact the development team.
