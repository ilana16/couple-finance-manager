# Currency Conversion Quick Start Guide

## ✅ What's Already Done

The multi-currency conversion feature has been successfully deployed! The app now includes:

- ✅ Currency selector in transaction form (8 currencies supported)
- ✅ Automatic conversion logic to NIS for calculations
- ✅ Updated all financial calculations (Dashboard, Budgets, Reports)
- ✅ Migration script for existing transactions
- ✅ Exchange rate caching system

## 🔧 What You Need to Do

### Step 1: Get Your Free API Key (5 minutes)

1. Go to **https://www.exchangerate-api.com/**
2. Click the **"Get Free Key"** button
3. Enter your email address
4. Check your email and confirm
5. Copy your API key from the dashboard

**Free Tier Benefits:**
- 1,500 requests per month
- No credit card required
- Updates once per day (perfect for personal finance)

### Step 2: Add API Key to Your App (2 minutes)

1. Open your code editor
2. Navigate to: `src/services/currencyService.ts`
3. Find line 6:
   ```typescript
   const API_KEY = 'YOUR_API_KEY_HERE';
   ```
4. Replace with your actual key:
   ```typescript
   const API_KEY = 'abc123def456ghi789'; // Your real key
   ```
5. Save the file
6. Commit and push:
   ```bash
   git add src/services/currencyService.ts
   git commit -m "Add ExchangeRate-API key"
   git push origin main
   ```

The app will automatically redeploy to Netlify (takes ~1-2 minutes).

### Step 3: Migrate Existing Transactions (5 minutes)

After the app redeploys with your API key:

1. Open your app: **https://main--usfin.netlify.app/**
2. Log in to your account
3. Open browser console:
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
   - **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - **Safari**: Enable Developer menu first, then press `Cmd+Option+C`
4. In the console, paste this command and press Enter:
   ```javascript
   import('./scripts/migrateCurrencyConversion.js').then(m => m.migrateCurrencyConversion());
   ```
5. Wait for the migration to complete (you'll see progress in the console)
6. Refresh the page

**What the migration does:**
- Processes all existing transactions
- Converts amounts to NIS using current exchange rates
- Adds the `amountInNIS` field to each transaction
- Shows you how many transactions were updated

## 🎉 You're Done!

After completing these steps, your app will:
- ✅ Accept transactions in multiple currencies
- ✅ Automatically convert everything to NIS for accurate calculations
- ✅ Display transactions in their original currency
- ✅ Show all totals and budgets in NIS
- ✅ Cache exchange rates for 24 hours to save API calls

## 📊 How to Use the Feature

### Adding a Multi-Currency Transaction

1. Click **"Add Transaction"**
2. Fill in the amount (e.g., `100`)
3. Select the currency from the dropdown (e.g., `$ USD`)
4. Fill in other details (description, category, etc.)
5. Click **"Add Transaction"**

The app will automatically:
- Convert $100 USD to NIS (e.g., ₪365.00 at current rates)
- Store both the original amount ($100 USD) and converted amount (₪365.00)
- Use the NIS amount for all calculations
- Display the original currency in the transaction list

### Viewing Calculations

All financial calculations now use NIS amounts:
- **Dashboard**: Total income, expenses, balance
- **Budgets**: Budget limits vs. spent amounts
- **Reports**: Category breakdowns and trends
- **Savings Goals**: Goal progress

## 🔍 Testing the Feature

To verify everything works:

1. **Add a test transaction in USD**:
   - Amount: 100
   - Currency: $ USD
   - Category: Daily/Other Expenses
   - Type: Expense

2. **Check the Dashboard**:
   - The expense should show in NIS (approximately ₪365)
   - Total expenses should include the converted amount

3. **Check the transaction list**:
   - Transaction should display with original currency indicator

## 📱 Example Scenarios

### Scenario 1: Shopping in USD
- You buy something online for $50 USD
- Add transaction: Amount = 50, Currency = USD
- App converts to ₪182.50 (example rate)
- Budget calculations use ₪182.50

### Scenario 2: Salary in NIS
- You receive salary of ₪10,000 NIS
- Add transaction: Amount = 10000, Currency = NIS
- No conversion needed (NIS to NIS)
- Income shows as ₪10,000

### Scenario 3: Travel Expense in EUR
- You spend €200 EUR on a trip
- Add transaction: Amount = 200, Currency = EUR
- App converts to ₪800 (example rate)
- Travel budget uses ₪800

## 🛠️ Troubleshooting

### "API request failed" Error
**Cause**: API key not set or invalid
**Fix**: Complete Step 2 above and redeploy

### Migration Doesn't Run
**Cause**: Browser console syntax or connection issue
**Fix**: 
1. Make sure you're on the deployed app (not localhost)
2. Check that you're logged in
3. Try the command again
4. Check browser console for specific error messages

### Amounts Look Wrong
**Cause**: Old cached exchange rates
**Fix**: 
1. Open browser console
2. Run: `localStorage.removeItem('currency_exchange_rates')`
3. Refresh the page

### Existing Transactions Not Converting
**Cause**: Migration not run yet
**Fix**: Complete Step 3 above

## 📚 Additional Resources

- **Full Documentation**: See `CURRENCY_SETUP.md` for detailed information
- **ExchangeRate-API Docs**: https://www.exchangerate-api.com/docs
- **Supported Currencies**: ILS, USD, EUR, GBP, JPY, CAD, AUD, CHF

## 💡 Tips

1. **Exchange rates update once per day** - This is perfect for personal finance tracking
2. **Rates are cached for 24 hours** - Minimizes API calls and stays within free tier
3. **Original currency is preserved** - You can always see what currency you actually used
4. **All calculations use NIS** - Ensures accurate totals across different currencies
5. **Migration is safe** - It skips transactions that already have `amountInNIS`

## 🎯 Next Steps

After setup is complete, consider:
- Adding transactions in different currencies to test
- Checking budget calculations with multi-currency expenses
- Reviewing the Reports page to see currency-converted trends
- Setting up savings goals that work across currencies

## ❓ Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key is correct
3. Ensure you have internet connection
4. Review the full documentation in `CURRENCY_SETUP.md`

---

**Estimated Total Time**: 12-15 minutes
**Difficulty**: Easy (just copy/paste and follow steps)
**Result**: Full multi-currency support in your finance app! 🎉
