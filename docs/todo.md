# Couple Finance Manager - TODO

## Current Sprint - Final Enhancements

### AI Insights Widget on Dashboard
- [ ] Add AI insights widget to dashboard home page
- [ ] Fetch insights from dashboard.insights API endpoint
- [ ] Display insights in a prominent card with loading state
- [ ] Add refresh button for insights

### Transaction Attachments with S3
- [ ] Add attachments field to transactions schema
- [ ] Implement S3 file upload for transaction receipts
- [ ] Add file upload UI to transaction form
- [ ] Display attached files in transaction list
- [ ] Add download/view functionality for attachments

### Edit Dialogs for Goals and Debts
- [ ] Add edit dialog to Goals page with all fields
- [ ] Add edit dialog to Debts page with all fields
- [ ] Test all CRUD operations for Goals and Debts

## Completed Features

### Core Features
- [x] Database schema with all financial entities
- [x] Authentication and user management
- [x] Dashboard with projected vs actual tracking
- [x] Flexible balance calculations (daily/weekly/monthly)
- [x] Credit management and tracking
- [x] Pending transactions monitoring
- [x] Transaction management with CRUD operations
- [x] Transaction status filters (All, Projected, Pending, Actual, Recurring)
- [x] Transaction editing with inline dialogs
- [x] Bulk selection and bulk delete for transactions
- [x] Budget management with edit/delete API endpoints
- [x] Savings goals tracking with edit/delete API endpoints
- [x] Debt payoff calculator with edit/delete API endpoints
- [x] Investment tracking
- [x] Custom categories with colors
- [x] Recurring transactions management
- [x] Automatic recurring transaction generation
- [x] CSV import/export functionality
- [x] Partner management page with individual/joint views
- [x] Accounts management (checking, savings, credit, investment)
- [x] Reports page with interactive charts (Recharts)
- [x] Spending trends visualization
- [x] Category breakdown pie charts
- [x] Income vs expenses bar charts
- [x] Monthly comparison analytics
- [x] Notification preferences in Settings
- [x] ILS currency formatting throughout
- [x] AI-powered spending insights API endpoint

## Future Enhancements (25-Step Plan)

### Phase 1: Core Functionality (Steps 4-5, 8)
- [ ] 4. Add bulk categorize operation for transactions
- [ ] 5. Add bulk status change for transactions
- [ ] 8. Build advanced search with date range and amount filters

### Phase 2: Partner Collaboration (Steps 9-12)
- [ ] 9. Implement backend partner invitation API
- [ ] 10. Add joint view data filtering
- [ ] 11. Create shared notes and reminders
- [ ] 12. Add partner activity feed

### Phase 3: Budget and Goal Management (Steps 13-16)
- [ ] 13. Add budget templates (50/30/20, zero-based)
- [ ] 14. Implement budget rollover
- [ ] 15. Add goal contribution tracking
- [ ] 16. Create goal milestones with celebrations

### Phase 4: Automation and AI (Steps 18-20)
- [ ] 18. Add automatic transaction categorization
- [ ] 19. Create smart budget recommendations
- [ ] 20. Implement anomaly detection

### Phase 5: Reporting and Analytics (Steps 21-25)
- [ ] 21. Add monthly financial PDF reports
- [ ] 22. Create tax category tracking
- [ ] 23. Build net worth tracking over time
- [ ] 24. Add spending comparison (month-over-month)
- [ ] 25. Implement financial health score


## Current Implementation - 10 Priority Enhancements

### 1. File Upload UI for Transactions
- [x] Add uploadAttachment mutation to frontend
- [x] Implement file input with preview in transaction dialog
- [x] Show upload progress and file list
- [x] Handle file size validation (max 5MB)

### 2. Display Attached Files in Transaction List
- [x] Add attachment icon to transactions with files
- [x] Implement click-to-view/download functionality
- [x] Show attachment count badge

### 3. Edit Dialogs for Goals and Debts
- [x] Complete Goals edit dialog with all fields
- [x] Complete Debts edit dialog with all fields
- [x] Add edit/delete buttons to Goals cards
- [x] Add edit/delete buttons to Debts cards

### 4. Bulk Categorize Operation
- [x] Add category dropdown to bulk actions bar
- [x] Implement bulk update API endpoint
- [x] Update selected transactions with new category

### 5. Bulk Status Change
- [x] Add status toggle to bulk actions bar
- [x] Implement bulk status update API endpoint
- [x] Update selected transactions with new status

### 6. Date Range Filter
- [x] Add date range picker component
- [x] Implement preset ranges (this week, month, etc.)
- [x] Filter transactions by selected date range

### 7. Amount Range Filter
- [x] Add min/max amount slider component
- [x] Implement amount range state management
- [x] Filter transactions by amount range

### 8. AI Category Suggestions
- [ ] Add "Suggest Category" button to transaction form
- [ ] Create AI suggestion API endpoint using LLM
- [ ] Display suggested category with confidence score

### 9. Budget Templates
- [ ] Create budget templates page
- [ ] Implement 50/30/20 rule template
- [ ] Implement zero-based budgeting template
- [ ] Add apply template functionality

### 10. Financial Health Score
- [ ] Calculate health score based on metrics
- [ ] Add health score widget to dashboard
- [ ] Show improvement tips and recommendations

### 11. Monthly PDF Reports
- [ ] Create PDF generation endpoint
- [ ] Add charts and spending breakdowns
- [ ] Implement download functionality
- [ ] Test full CRUD operations

### 4. Bulk Categorize Operation
- [ ] Add category dropdown in bulk actions bar
- [ ] Implement bulk update category mutation
- [ ] Update UI after bulk categorize

### 5. Bulk Status Change
- [ ] Add status dropdown in bulk actions bar
- [ ] Implement bulk update status mutation
- [ ] Support projected/pending/actual changes

### 6. Advanced Search Filters
- [ ] Add date range picker component
- [ ] Add amount range slider
- [ ] Add multi-category selection
- [ ] Update filter logic

### 7. Monthly Financial PDF Reports
- [ ] Create PDF generation endpoint with charts
- [ ] Add download button in Reports page
- [ ] Include spending summary and insights

### 8. AI Transaction Categorization
- [ ] Create AI category suggestion endpoint
- [ ] Add "Suggest Category" button in form
- [ ] Auto-apply suggestion on confirmation

### 9. Budget Templates
- [ ] Create template data (50/30/20, zero-based, custom)
- [ ] Add template selector in Budgets page
- [ ] Implement apply template with category mapping

### 10. Financial Health Score
- [ ] Calculate savings rate, debt ratio, budget adherence
- [ ] Create health score widget for dashboard
- [ ] Display score breakdown with improvement tips


## New Enhancement Implementation (User Request)

### AI Category Suggestions
- [x] Create AI category suggestion API endpoint in routers.ts
- [x] Add "Suggest Category" button to transaction form
- [x] Display suggested category with confidence score
- [x] Allow user to accept or modify suggestion

### Budget Templates
- [x] Create budget templates data structure (50/30/20, zero-based)
- [x] Add template selector UI in Budgets page
- [x] Implement apply template functionality with category mapping
- [x] Add template preview before applying

### Financial Health Score
- [x] Calculate savings rate from transactions
- [x] Calculate debt-to-income ratio
- [x] Calculate budget adherence percentage
- [x] Create health score widget for dashboard (0-100)
- [x] Display score breakdown with improvement tips
- [x] Add visual progress indicator


## Final Enhancement Implementation (User Request)

### PDF Export Reports
- [x] Install PDF generation library (pdfkit + chartjs-node-canvas)
- [x] Create generateReport API endpoint in routers.ts
- [x] Generate monthly/yearly financial summary with income vs expenses
- [x] Add category breakdown charts to PDF (pie chart)
- [x] Include goal progress visualization
- [x] Add "Generate Report" button to Reports page
- [x] Support date range selection for custom reports (monthly/yearly/custom)

### Recurring Transaction Automation
- [x] Create background job scheduler for recurring transactions
- [x] Implement automatic transaction creation based on frequency
- [x] Add "Skip Next Occurrence" functionality
- [x] Add schema fields for tracking recurring dates
- [x] Display next scheduled date for recurring transactions
- [x] Add pause/resume functionality for recurring transactions

### Partner Collaboration Features
- [x] Add approval workflow schema fields to transactions
- [x] Implement @mention functionality in shared notes (via schema)
- [x] Create transaction approval workflow (request/approve/reject)
- [x] Add approval status badges to transactions (pending/approved/rejected)
- [x] Show pending approvals widget on dashboard
- [x] Add approval endpoints (requestApproval, approveTransaction, pendingApprovals)
- [x] Display pending approvals with approve/reject buttons


## Advanced Features Implementation (User Request)

### Multi-Currency Support
- [x] Add currency field to transactions schema
- [x] Integrate currency conversion API (exchangerate.host)
- [x] Create currency conversion helper functions
- [x] Add universal currency selector to dashboard header
- [x] Display supported currencies with symbols
- [x] Create currency conversion endpoints
- [x] Add preferred currency to user settings
- [x] Backend foundation complete for future UI integration

### Smart Spending Alerts
- [x] Create alerts schema (spendingAlerts, alertHistory)
- [x] Implement budget threshold monitoring (80%, 90%, 100%)
- [x] Add unusual spending pattern detection (2x average)
- [x] Create alert monitoring system (checkUserAlerts)
- [x] Add alerts API endpoints (list, history, unreadCount, markRead, checkNow)
- [x] Show alert notifications bell icon on dashboard
- [x] Display unread count badge
- [x] Track alert history with severity levels

### Investment Portfolio Tracker
- [x] Integrate Yahoo Finance API via Manus Data API Hub
- [x] Add real-time price updates endpoint (livePrice)
- [x] Calculate portfolio performance (gains/losses, percentages)
- [x] Create performance query with current prices
- [x] Add live performance summary cards to Investments page
- [x] Show total portfolio value, gain/loss, and holdings count
- [x] Color-coded gains (green) and losses (red)
- [x] Backend complete with Yahoo Finance integration


## Latest Features Implementation (User Request)

### Transaction Receipt Scanner
- [ ] Add file upload component to transaction form
- [ ] Integrate OCR API for receipt text extraction
- [ ] Parse receipt data (amount, date, merchant, category)
- [ ] Auto-fill transaction form with extracted data
- [ ] Add preview of uploaded receipt image
- [ ] Handle multiple receipt formats
- [ ] Add confidence scoring for extracted fields
- [ ] Allow manual correction before submission

### Bill Payment Reminders
- [ ] Create bills schema (name, amount, dueDate, frequency, status)
- [ ] Build Bills page with list view
- [ ] Add calendar view for bill due dates
- [ ] Implement automatic reminders 3 days before due date
- [ ] Add mark-as-paid functionality
- [ ] Track payment history
- [ ] Show upcoming bills widget on dashboard
- [ ] Add recurring bill support (monthly, quarterly, yearly)
