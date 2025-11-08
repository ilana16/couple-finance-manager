# Couple Finance Manager 💰

A comprehensive financial management application designed for couples to manage their finances together. Now with **enhanced budget period views**, **reimbursement tracking**, **financial health monitoring**, and **easy Excel import**!

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ilana16/couple-finance-manager)

## 🎉 What's New

### ✨ Latest Features (November 2025)

- **📊 Budget Period Views**: Toggle between Weekly, Monthly, and Yearly views with automatic conversion
- **💵 Reimbursement Tracking**: Track expenses that get reimbursed (medical, transportation, etc.)
- **❤️ Financial Health Score**: Overall wellness score (0-100) with personalized recommendations
- **📋 Budget Templates**: Quick setup with 50/30/20, Zero-Based, or your custom template
- **📥 Excel Import**: Import your existing budget spreadsheet with one click
- **🎯 "What's Left" Calculator**: See exactly how much you have remaining after expenses

## 🚀 Quick Start

### Deploy to Netlify (Recommended)

1. Click the "Deploy to Netlify" button above
2. Connect your GitHub account
3. Configure environment variables (optional)
4. Your site will be live in ~2 minutes!

### Local Development

```bash
# Clone the repository
git clone https://github.com/ilana16/couple-finance-manager.git
cd couple-finance-manager

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see your app!

## 📋 Features

### Core Financial Management

#### 💳 Transactions
- Full CRUD operations (Create, Read, Update, Delete)
- Status tracking: Projected, Pending, Actual, Recurring
- Bulk operations: Select multiple, delete, categorize, change status
- File attachments with S3 storage
- CSV import/export
- Advanced filtering: Date range, amount range, category, status

#### 📊 Enhanced Budgets
- **NEW**: Toggle between Weekly, Monthly, and Yearly views
- **NEW**: Automatic amount conversion between periods
- **NEW**: "What's Left" calculation (Income - Expenses + Starting Balance)
- **NEW**: Visual progress bars with status indicators
- Budget vs Actual comparison
- Spending alerts at 80%, 90%, and 100% thresholds
- Category-level budget tracking
- Rollover support for unused amounts

#### 💵 Reimbursement Tracking (NEW!)
- Mark transactions as reimbursable
- Track status: Pending, Received, Denied
- Link expenses to reimbursement income
- Dashboard widget showing pending reimbursements
- Overdue detection (30+ days)
- Category-level reimbursement breakdown
- Average days to reimburse calculation

#### ❤️ Financial Health Dashboard (NEW!)
- **Overall Score** (0-100) based on:
  - **Savings Rate**: Percentage of income saved
  - **Debt-to-Income Ratio**: Debt relative to income
  - **Budget Adherence**: Staying within budgets
  - **Emergency Fund**: Months of expenses covered
- Trend tracking (Improving, Stable, Declining)
- Personalized recommendations by priority
- Detailed breakdowns for each component
- Actionable improvement tips

#### 📋 Budget Templates (NEW!)
- **50/30/20 Rule**: 50% Needs, 30% Wants, 20% Savings
- **Zero-Based Budget**: Every dollar assigned
- **Your Spreadsheet**: Based on your uploaded Excel file
- **Essentials First**: Prioritize essential expenses
- One-click application
- Customizable amounts

#### 📥 Excel/CSV Import (NEW!)
- Import your existing budget spreadsheet
- Auto-detect format (your spreadsheet or generic)
- Validate data before importing
- Preview before committing
- Support for monthly and weekly amounts
- Income and expense categorization

### Existing Features

#### 💰 Accounts
- Checking, Savings, Credit, and Investment accounts
- Real-time balance tracking
- Credit utilization monitoring
- Account transfers

#### 🎯 Savings Goals
- Set and track financial goals
- Progress visualization
- Target date tracking
- Priority levels
- Milestone celebrations

#### 📉 Debt Management
- Track multiple debts
- Payoff calculators
- Interest rate tracking
- Payment strategies (Avalanche, Snowball)
- Payoff timeline visualization

#### 📈 Investments
- Portfolio tracking
- Real-time price updates (Yahoo Finance integration)
- Gain/loss calculation
- Asset allocation
- Performance metrics

#### 🔄 Recurring Transactions
- Automated recurring transaction generation
- Flexible frequencies: Daily, Weekly, Bi-weekly, Monthly, Quarterly, Yearly
- Skip next occurrence
- Adjust amount for next occurrence
- Pause/resume functionality

#### 👥 Partner Collaboration
- Individual vs Joint view toggle
- Shared financial planning
- Transaction approval workflow
- Partner activity tracking
- Shared notes and reminders

#### 📊 Reports & Analytics
- Interactive charts (Recharts)
- Spending trends visualization
- Category breakdown pie charts
- Income vs Expenses bar charts
- Monthly comparison analytics
- PDF report generation

#### 🎨 Categories
- Custom categories with colors
- Category groups (Essential, Discretionary, Savings)
- Subcategories support
- Budget defaults per category
- Spending trends by category

#### 🔔 Smart Alerts
- Budget threshold monitoring (80%, 90%, 100%)
- Unusual spending detection (2x average)
- Pending reimbursement alerts
- Bill payment reminders
- Goal milestone notifications

#### 🌍 Multi-Currency Support
- Track finances in multiple currencies
- Automatic conversion (ILS, USD, EUR, etc.)
- Real-time exchange rates
- Display in multiple currencies simultaneously

#### 🤖 AI-Powered Features
- Spending insights and analysis
- Category suggestions
- Budget optimization recommendations
- Anomaly detection

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **API**: tRPC for type-safe API calls
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Validation**: Zod
- **Build Tool**: Vite
- **Deployment**: Netlify

## 📁 Project Structure

```
couple-finance-manager/
├── src/
│   ├── components/              # React components
│   │   ├── App.tsx
│   │   ├── EnhancedBudgets.tsx         # NEW: Budget period views
│   │   ├── ReimbursementWidget.tsx     # NEW: Reimbursement tracking
│   │   ├── FinancialHealthWidget.tsx   # NEW: Health dashboard
│   │   ├── Home.tsx
│   │   ├── Transactions.tsx
│   │   ├── Accounts.tsx
│   │   ├── Goals.tsx
│   │   ├── Debts.tsx
│   │   ├── Investments.tsx
│   │   ├── RecurringTransactions.tsx
│   │   ├── Partner.tsx
│   │   ├── Categories.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   ├── lib/                     # Utilities and logic
│   │   ├── enhanced-schema.ts           # NEW: Enhanced schemas
│   │   ├── budgetPeriodUtils.ts         # NEW: Period conversions
│   │   ├── reimbursementUtils.ts        # NEW: Reimbursement logic
│   │   ├── financialHealthCalculator.ts # NEW: Health score
│   │   ├── budgetTemplates.ts           # NEW: Budget templates
│   │   ├── excelImporter.ts             # NEW: Excel import
│   │   ├── routers.ts
│   │   ├── schema.ts
│   │   ├── currency.ts
│   │   ├── pdfReport.ts
│   │   └── ... (other utilities)
│   └── main.tsx
├── docs/                        # Documentation
│   ├── IMPLEMENTATION_PLAN.md
│   ├── IMPLEMENTATION_SUMMARY.md        # NEW: Feature docs
│   ├── todo.md
│   ├── ideas.md
│   └── budget_analysis.md
├── data/                        # Reference data
│   ├── Monthlybudget.xlsx
│   └── ... (Hebrew calendar files)
├── netlify.toml                 # Netlify configuration
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── README.md
├── DEPLOYMENT_GUIDE.md          # NEW: Deployment instructions
└── NEXT_STEPS.md
```

## 📖 Usage Examples

### Budget Period Views

```typescript
// Toggle between periods
<button onClick={() => setSelectedPeriod('weekly')}>Weekly</button>
<button onClick={() => setSelectedPeriod('monthly')}>Monthly</button>
<button onClick={() => setSelectedPeriod('yearly')}>Yearly</button>

// Amounts automatically convert
const weeklyAmount = convertBudgetAmount(1200, 'monthly', 'weekly'); // 300
```

### Reimbursement Tracking

```typescript
// Mark transaction as reimbursable
const transaction = {
  ...transactionData,
  isReimbursable: true,
  reimbursementStatus: 'pending',
};

// When received
transaction.reimbursementStatus = 'received';
transaction.reimbursementAmount = 1300;
transaction.reimbursementDate = new Date();
```

### Financial Health Score

```typescript
import { calculateFinancialHealth } from './lib/financialHealthCalculator';

const healthData = calculateFinancialHealth({
  transactions,
  budgets,
  accounts,
});

console.log(healthData.overallScore); // 68
console.log(healthData.recommendations); // Personalized tips
```

### Budget Templates

```typescript
import { getBudgetTemplates, applyBudgetTemplate } from './lib/budgetTemplates';

const templates = getBudgetTemplates(4115); // Your monthly income
const budgets = applyBudgetTemplate(templates[0], userId);
```

### Excel Import

```typescript
import { importBudgetFromFile } from './lib/excelImporter';

const data = importBudgetFromFile(csvContent);
// Creates budgets from your spreadsheet
```

## 🎯 Your Budget Integration

Based on your provided spreadsheet (Monthlybudget.xlsx), the application now supports:

- ✅ **Dual Currency Tracking**: NIS (₪4,115/month) and USD ($1,232/month)
- ✅ **Weekly and Monthly Views**: Automatic conversion (monthly ÷ 4)
- ✅ **Reimbursement Tracking**: Medical (₪1,300) and Transportation (₪465)
- ✅ **Deficit Monitoring**: Currently -₪210/month
- ✅ **9 Expense Categories**: Food, Health, Transport, Toiletries, Subscriptions, Vape, Off-Base Food, Hostel, Other
- ✅ **4 Income Sources**: Allowance, Paycheck, Meds (reimbursement), Rav-Kav (reimbursement)
- ✅ **Starting Balance**: Tracked per period
- ✅ **"What's Left" Calculation**: Income - Expenses + Starting Balance

## 🚀 Deployment

### Netlify (Recommended)

1. **Connect Repository**:
   - Go to https://www.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Select GitHub → Choose `ilana16/couple-finance-manager`

2. **Configure** (auto-detected from netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 20

3. **Deploy**: Click "Deploy site"

4. **Environment Variables** (optional):
   - Add in Site settings → Environment variables
   - See `.env.example` for required variables

### Other Platforms

- **Vercel**: Auto-detects Vite, zero configuration
- **AWS S3 + CloudFront**: See DEPLOYMENT.md for instructions
- **Docker**: Dockerfile included

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# API Configuration
VITE_API_URL=https://your-api-url.com

# OAuth
VITE_OAUTH_CLIENT_ID=your_oauth_client_id

# S3 (for file uploads)
VITE_S3_BUCKET=your-s3-bucket
VITE_S3_REGION=your-s3-region

# External APIs
VITE_YAHOO_FINANCE_API_KEY=your_key
VITE_EXCHANGE_RATE_API_KEY=your_key

# Feature Flags
VITE_ENABLE_AI_INSIGHTS=true
VITE_ENABLE_MULTI_CURRENCY=true
```

## 📚 Documentation

- **[README.md](README.md)** - This file
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Feature documentation
- **[NEXT_STEPS.md](NEXT_STEPS.md)** - Future enhancements
- **[budget_analysis.md](docs/budget_analysis.md)** - Spreadsheet analysis

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React and TypeScript
- UI components styled with Tailwind CSS
- Charts powered by Recharts
- Icons from Lucide React
- Inspired by personal finance best practices

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/ilana16/couple-finance-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ilana16/couple-finance-manager/discussions)
- **Documentation**: See docs/ folder

## 🎉 What Makes This Special

### For Your Specific Needs

1. **Matches Your Spreadsheet**: Designed to work exactly like your Monthlybudget.xlsx
2. **Reimbursement Focus**: Built-in support for medical and transportation reimbursements
3. **Multi-Currency**: Native support for NIS and USD
4. **Weekly/Monthly Toggle**: See your budget in the time period that makes sense
5. **Deficit Tracking**: Always know if you're over or under budget

### Technical Excellence

- **Type-Safe**: Full TypeScript coverage
- **Modern Stack**: React 18, Vite, Tailwind CSS
- **Production-Ready**: Netlify deployment configured
- **Well-Documented**: Comprehensive documentation
- **Extensible**: Easy to add new features

### User-Friendly

- **Intuitive UI**: Clean, modern interface
- **Visual Feedback**: Progress bars, color coding, status badges
- **Quick Setup**: Budget templates for instant start
- **Easy Import**: Upload your existing spreadsheet
- **Smart Alerts**: Know when you're approaching limits

---

**Ready to take control of your finances? Deploy now and start tracking!** 🚀

**Repository**: https://github.com/ilana16/couple-finance-manager  
**Live Demo**: Coming soon (deploy to Netlify)  
**Last Updated**: November 8, 2025
