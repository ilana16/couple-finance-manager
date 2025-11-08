# Deployment Guide - Couple Finance Manager

## Quick Start for Netlify Deployment

### Prerequisites
- GitHub account (already set up ✅)
- Netlify account (free tier works great)
- Your repository: https://github.com/ilana16/couple-finance-manager

### Step 1: Connect to Netlify

1. **Go to Netlify**: https://www.netlify.com
2. **Sign up/Login** with your GitHub account
3. **Click "Add new site"** → "Import an existing project"
4. **Select GitHub** as your Git provider
5. **Choose your repository**: `ilana16/couple-finance-manager`

### Step 2: Configure Build Settings

Netlify should auto-detect your settings from `netlify.toml`, but verify:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 20 (set in netlify.toml)

### Step 3: Deploy!

Click **"Deploy site"** and Netlify will:
1. Install dependencies
2. Build your application
3. Deploy to a live URL (e.g., `https://your-site-name.netlify.app`)

### Step 4: Configure Environment Variables (Optional)

If you need API keys or configuration:

1. Go to **Site settings** → **Environment variables**
2. Add variables from `.env.example`:
   - `VITE_API_URL`
   - `VITE_OAUTH_CLIENT_ID`
   - etc.

### Step 5: Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow instructions to configure DNS

---

## Continuous Deployment

Netlify is now watching your GitHub repository. Every time you push to `main`:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Netlify will automatically:
1. Detect the push
2. Build your site
3. Deploy the new version
4. Your site updates in ~2 minutes!

---

## Local Development

### Setup

```bash
# Clone the repository
git clone https://github.com/ilana16/couple-finance-manager.git
cd couple-finance-manager

# Install dependencies
npm install

# Start development server
npm run dev
```

Your site will be available at `http://localhost:5173`

### Build Locally

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Features Implemented

### ✅ Priority 1: Critical Features

1. **Enhanced Budget Period Views**
   - Toggle between Weekly, Monthly, and Yearly views
   - Automatic amount conversion
   - "What's Left" calculation with deficit/surplus indicators
   - Visual progress bars and status badges

2. **Reimbursement Tracking System**
   - Mark transactions as reimbursable
   - Track reimbursement status (Pending, Received, Denied)
   - Link expenses to reimbursement income
   - Dashboard widget showing pending reimbursements
   - Overdue detection (30+ days)

3. **Multi-Currency Support** (Schema Ready)
   - Currency field on transactions and budgets
   - Conversion utilities ready
   - Display in multiple currencies

4. **Budget Import from Excel/CSV**
   - Import your existing budget spreadsheet
   - Auto-detect format
   - Validate and preview before importing
   - Support for monthly and weekly amounts

### ✅ Priority 2: High-Impact Enhancements

5. **Financial Health Dashboard**
   - Overall health score (0-100)
   - Component scores: Savings Rate, Debt-to-Income, Budget Adherence, Emergency Fund
   - Trend tracking (Improving, Stable, Declining)
   - Personalized recommendations

6. **Budget Templates**
   - 50/30/20 Rule template
   - Zero-Based Budget template
   - Your Spreadsheet template (based on your Excel file)
   - Essentials First template
   - One-click application

---

## Using the New Features

### Budget Period Views

```typescript
// In EnhancedBudgets component
<button onClick={() => setSelectedPeriod('weekly')}>Weekly</button>
<button onClick={() => setSelectedPeriod('monthly')}>Monthly</button>
<button onClick={() => setSelectedPeriod('yearly')}>Yearly</button>
```

The view automatically:
- Converts all amounts to selected period
- Updates "What's Left" calculation
- Shows appropriate date range
- Adjusts progress bars

### Reimbursement Tracking

```typescript
// Mark transaction as reimbursable
transaction.isReimbursable = true;
transaction.reimbursementStatus = 'pending';

// When reimbursement received
transaction.reimbursementStatus = 'received';
transaction.reimbursementAmount = 1300;
transaction.reimbursementDate = new Date();

// Link to income transaction
transaction.linkedReimbursementId = incomeTransaction.id;
```

### Financial Health Score

```typescript
import { calculateFinancialHealth } from './lib/financialHealthCalculator';

const healthData = calculateFinancialHealth({
  transactions,
  budgets,
  accounts,
});

// Returns:
// - overallScore: 68
// - savingsRate: 12.5%
// - debtToIncomeRatio: 25%
// - budgetAdherence: 75%
// - emergencyFundMonths: 2.5
// - recommendations: [...]
```

### Budget Templates

```typescript
import { getBudgetTemplates, applyBudgetTemplate } from './lib/budgetTemplates';

// Get all templates
const templates = getBudgetTemplates(4115); // Your monthly income

// Apply a template
const budgets = applyBudgetTemplate(templates[2], userId); // Your spreadsheet template
```

### Excel Import

```typescript
import { importBudgetFromFile, validateImportedData } from './lib/excelImporter';

// Import from CSV content
const data = importBudgetFromFile(csvContent);

// Validate
const validation = validateImportedData(data);
if (validation.isValid) {
  // Create budgets from imported data
  data.categories.forEach(category => {
    createBudget({
      name: category.name,
      monthlyAmount: category.monthlyAmount,
      weeklyAmount: category.weeklyAmount,
    });
  });
}
```

---

## Project Structure

```
couple-finance-manager/
├── src/
│   ├── components/              # React components
│   │   ├── App.tsx
│   │   ├── EnhancedBudgets.tsx
│   │   ├── ReimbursementWidget.tsx
│   │   ├── FinancialHealthWidget.tsx
│   │   └── ... (14 pages total)
│   ├── lib/                     # Utilities and logic
│   │   ├── enhanced-schema.ts
│   │   ├── budgetPeriodUtils.ts
│   │   ├── reimbursementUtils.ts
│   │   ├── financialHealthCalculator.ts
│   │   ├── budgetTemplates.ts
│   │   ├── excelImporter.ts
│   │   └── ... (existing utilities)
│   └── main.tsx                 # Entry point
├── docs/                        # Documentation
│   ├── IMPLEMENTATION_PLAN.md
│   ├── todo.md
│   ├── ideas.md
│   └── budget_analysis.md
├── data/                        # Reference data
│   ├── Monthlybudget.xlsx
│   └── ... (Hebrew calendar files)
├── netlify.toml                 # Netlify configuration
├── package.json                 # Dependencies
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind CSS config
├── README.md                    # Project overview
├── DEPLOYMENT_GUIDE.md          # This file
├── IMPLEMENTATION_SUMMARY.md    # Feature documentation
└── NEXT_STEPS.md               # Recommendations
```

---

## Environment Variables

Create a `.env` file in the root directory (or configure in Netlify):

```env
# API Configuration (when backend is ready)
VITE_API_URL=https://your-api-url.com
VITE_TRPC_URL=https://your-api-url.com/trpc

# OAuth Configuration
VITE_OAUTH_CLIENT_ID=your_oauth_client_id
VITE_OAUTH_REDIRECT_URI=https://your-domain.com/api/oauth/callback

# S3 Configuration (for file uploads)
VITE_S3_BUCKET=your-s3-bucket
VITE_S3_REGION=your-s3-region

# External API Keys
VITE_YAHOO_FINANCE_API_KEY=your_yahoo_finance_key
VITE_EXCHANGE_RATE_API_KEY=your_exchange_rate_key

# Feature Flags
VITE_ENABLE_AI_INSIGHTS=true
VITE_ENABLE_MULTI_CURRENCY=true
VITE_ENABLE_INVESTMENT_TRACKING=true
```

---

## Troubleshooting

### Build Fails on Netlify

**Check**:
1. Node version is 20 (set in netlify.toml)
2. All dependencies are in package.json
3. Build command is `npm run build`
4. No TypeScript errors locally

**Fix**:
```bash
# Test build locally
npm run build

# Check for errors
npm run lint
```

### Site Loads But Features Don't Work

**Check**:
1. Environment variables are set in Netlify
2. API endpoints are accessible
3. Browser console for errors

### Reimbursement Widget Not Showing

**Check**:
1. Transactions have `isReimbursable: true`
2. Reimbursement status is set
3. Component is imported and rendered

### Budget Period Toggle Not Working

**Check**:
1. Budget has all period amounts (weekly, monthly, yearly)
2. Period state is being updated
3. Conversion functions are working

---

## Performance Tips

### Optimize Bundle Size

```bash
# Analyze bundle
npm run build
# Check dist/ folder size
```

### Lazy Load Components

```typescript
// Lazy load heavy components
const FinancialHealthPage = lazy(() => import('./components/FinancialHealthWidget'));
```

### Cache API Responses

```typescript
// Use React Query for caching
const { data } = useQuery('budgets', fetchBudgets, {
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

---

## Security Checklist

- [ ] Environment variables not committed to Git
- [ ] API keys stored securely in Netlify
- [ ] HTTPS enabled (automatic with Netlify)
- [ ] Security headers configured (in netlify.toml)
- [ ] Input validation on all forms
- [ ] File upload size limits
- [ ] XSS protection enabled

---

## Monitoring

### Netlify Analytics

Enable in Site settings → Analytics to track:
- Page views
- Unique visitors
- Top pages
- Traffic sources

### Error Tracking

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for user behavior

---

## Updating the Site

### Small Changes

```bash
# Make changes
git add .
git commit -m "Update feature X"
git push origin main
# Netlify auto-deploys in ~2 minutes
```

### Major Changes

```bash
# Create a branch
git checkout -b feature/new-feature

# Make changes and test locally
npm run dev

# Commit and push
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# Create Pull Request on GitHub
# Netlify creates preview deployment
# Merge when ready → auto-deploys to production
```

---

## Support

### Documentation
- **README.md** - Project overview
- **IMPLEMENTATION_SUMMARY.md** - Feature details
- **NEXT_STEPS.md** - Future enhancements
- **budget_analysis.md** - Spreadsheet analysis

### Getting Help
- GitHub Issues for bugs
- GitHub Discussions for questions
- Netlify Support for deployment issues

---

## Next Steps

### Immediate (This Week)
1. ✅ Deploy to Netlify
2. ⏳ Test all features on live site
3. ⏳ Configure custom domain (optional)
4. ⏳ Set up environment variables

### Short Term (Next 2 Weeks)
1. Integrate backend API
2. Add database for data persistence
3. Implement authentication
4. Test reimbursement workflow end-to-end

### Medium Term (Next Month)
1. Add remaining Priority 3 features
2. Implement mobile optimizations
3. Add user onboarding flow
4. Create user documentation

### Long Term (Next 3 Months)
1. Bank integration
2. Mobile app (React Native)
3. Advanced analytics
4. Tax reporting features

---

## Success Metrics

Track these to measure success:

### Technical
- Build time < 2 minutes
- Page load time < 3 seconds
- Lighthouse score > 90
- Zero build errors

### User Experience
- Budget setup time < 5 minutes
- Reimbursement tracking adoption > 50%
- Financial health check frequency
- Template usage rate

---

## Congratulations! 🎉

Your Couple Finance Manager is ready to deploy. The implementation includes:

✅ All Priority 1 critical features
✅ Key Priority 2 enhancements  
✅ Production-ready configuration
✅ Comprehensive documentation
✅ Netlify deployment setup

**Deploy now and start managing your finances better!**

---

**Last Updated**: November 8, 2025  
**Repository**: https://github.com/ilana16/couple-finance-manager  
**Deployment Platform**: Netlify
