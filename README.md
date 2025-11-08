# Couple Finance Manager

A comprehensive financial management application designed for couples to manage their finances together. Track transactions, budgets, savings goals, debts, investments, and collaborate with your partner on shared financial planning.

## Features

### Core Financial Management
- **Dashboard**: Real-time overview with projected vs actual tracking
- **Transactions**: Full CRUD operations with status tracking (projected, pending, actual, recurring)
- **Accounts**: Manage checking, savings, credit, and investment accounts
- **Categories**: Custom categories with color coding for better organization
- **Budgets**: Create and track budgets with spending alerts
- **Savings Goals**: Set and monitor progress toward financial goals
- **Debts**: Track debts with payoff calculators and strategies
- **Investments**: Portfolio tracking with real-time price updates

### Advanced Features
- **Partner Collaboration**: Individual vs joint view toggle, shared financial planning
- **Transaction Attachments**: Upload receipts and documents with S3 storage
- **Recurring Transactions**: Automated recurring transaction generation
- **CSV Import/Export**: Easy data portability
- **Reports & Analytics**: Interactive charts showing spending trends, category breakdowns, and income vs expenses
- **AI-Powered Insights**: Smart spending analysis and recommendations
- **Multi-Currency Support**: Track finances in multiple currencies with automatic conversion
- **Smart Alerts**: Budget threshold monitoring and unusual spending detection
- **PDF Reports**: Generate downloadable financial summaries

### User Experience
- **Bulk Operations**: Bulk delete, categorize, and status changes for transactions
- **Advanced Filtering**: Date range and amount range filters
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Notification Preferences**: Customizable alerts and reminders
- **Credit Management**: Credit utilization tracking and monitoring
- **Pending Transactions**: Track and manage pending transactions

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Framework**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **API**: tRPC for type-safe API calls
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Validation**: Zod
- **Build Tool**: Vite
- **Authentication**: OAuth integration (Google, Microsoft, Apple)

## Project Structure

```
couplefin/
├── src/
│   ├── components/          # React components
│   │   ├── App.tsx         # Main application component
│   │   ├── AppLayout.tsx   # Layout wrapper with navigation
│   │   ├── Home.tsx        # Dashboard/home page
│   │   ├── Transactions.tsx
│   │   ├── Accounts.tsx
│   │   ├── Budgets.tsx
│   │   ├── Goals.tsx
│   │   ├── Debts.tsx
│   │   ├── Investments.tsx
│   │   ├── RecurringTransactions.tsx
│   │   ├── Partner.tsx
│   │   ├── Categories.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   ├── lib/                # Utility functions and API
│   │   ├── routers.ts      # tRPC API routers
│   │   ├── schema.ts       # Database schema
│   │   ├── currency.ts     # Currency utilities
│   │   ├── pdfReport.ts    # PDF generation
│   │   ├── receiptOCR.ts   # Receipt scanning
│   │   ├── recurringProcessor.ts
│   │   ├── alertMonitor.ts
│   │   └── trpc.ts
│   └── types/              # TypeScript type definitions
├── docs/                   # Documentation
│   ├── IMPLEMENTATION_PLAN.md
│   ├── todo.md
│   ├── ideas.md
│   └── google-sheet-requirements.md
├── data/                   # Data files
│   ├── candlelighting2.xlsx
│   ├── fasttimes.pdf
│   └── Hebrew_Calendar_5786_*.docx
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm/pnpm
- Modern web browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/couple-finance-manager.git
cd couple-finance-manager
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```
VITE_API_URL=your_api_url
VITE_OAUTH_CLIENT_ID=your_oauth_client_id
# Add other required environment variables
```

4. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Building for Production

```bash
npm run build
# or
pnpm build
```

The built files will be in the `dist/` directory.

## Deployment

### GitHub Pages
This project can be deployed to GitHub Pages:

1. Update `vite.config.ts` with your repository name:
```typescript
export default defineConfig({
  base: '/couple-finance-manager/',
  // ... other config
})
```

2. Build and deploy:
```bash
npm run build
npm run deploy
```

### Other Platforms
The application can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## Features Roadmap

### High Priority
- [ ] Goals Edit Dialog - Inline editing for goals
- [ ] Debts Edit Dialog - Inline editing for debts
- [ ] Enhanced bulk operations
- [ ] Advanced filtering improvements

### Medium Priority
- [ ] AI Category Suggestions - LLM-based recommendations
- [ ] Budget Templates - Pre-built frameworks (50/30/20, zero-based)
- [ ] Financial Health Score - Overall wellness metric
- [ ] Enhanced PDF Reports

### Future Enhancements
- [ ] Automatic transaction categorization (ML-based)
- [ ] Tax category tracking and reporting
- [ ] Net worth tracking over time
- [ ] Mobile app (React Native)
- [ ] Bank integration for automatic imports

See [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for detailed roadmap.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and TypeScript
- UI components styled with Tailwind CSS
- Charts powered by Recharts
- Icons from Lucide React

## Support

For questions or issues, please open an issue on GitHub or contact the maintainers.

---

**Note**: This application requires backend API services for full functionality. Ensure you have the necessary API endpoints configured before deployment.
