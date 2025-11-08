import React, { useState, useEffect } from 'react';
import { AuthProvider, ProtectedRoute, useAuth } from '../lib/auth';
import SidebarLayout from '../layouts/SidebarLayout';
import EnhancedBudgets from './EnhancedBudgets';
import { FinancialHealthPage } from './FinancialHealthWidget';
import { ReimbursementManagementPage } from './ReimbursementWidget';
import TransactionsPage from './TransactionsPage';
import GoalsPage from './GoalsPage';
import DebtsPage from './DebtsPage';
import InvestmentsPage from './InvestmentsPage';
import ReportsPage from './ReportsPage';
import NotesPage from './NotesPage';
import RemindersPage from './RemindersPage';


export default function SecureApp() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <MainApp />
      </ProtectedRoute>
    </AuthProvider>
  );
}

function MainApp() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { user } = useAuth();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'budgets':
        return <EnhancedBudgets />;
      case 'reimbursements':
        return <ReimbursementManagementPage />;
      case 'health':
        return <FinancialHealthPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'goals':
        return <GoalsPage />;
      case 'debts':
        return <DebtsPage />;
      case 'investments':
        return <InvestmentsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'notes':
        return <NotesPage />;
      case 'reminders':
        return <RemindersPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <SidebarLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </SidebarLayout>
  );
}

// Dashboard Page
function DashboardPage() {
  const { user, viewMode } = useAuth();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {viewMode === 'joint' ? 'Joint Dashboard' : 'My Dashboard'}
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {user?.name}! Here's your financial overview.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Balance" value="₪12,450" change="+5.2%" positive />
        <StatCard title="Monthly Income" value="₪4,115" change="+2.1%" positive />
        <StatCard title="Monthly Expenses" value="₪3,890" change="-3.5%" positive />
        <StatCard title="Savings Rate" value="5.5%" change="+1.2%" positive />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            <TransactionItem
              description="Grocery Shopping"
              amount={-150}
              category="Food"
              date="Today"
            />
            <TransactionItem
              description="Salary Deposit"
              amount={4115}
              category="Income"
              date="Yesterday"
            />
            <TransactionItem
              description="Electric Bill"
              amount={-280}
              category="Utilities"
              date="2 days ago"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Bills</h2>
          <div className="space-y-3">
            <BillItem name="Rent" amount={2500} dueDate="Dec 1" />
            <BillItem name="Internet" amount={120} dueDate="Dec 5" />
            <BillItem name="Phone" amount={80} dueDate="Dec 10" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, positive }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
      <p className={`text-sm font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
        {change}
      </p>
    </div>
  );
}

function TransactionItem({ description, amount, category, date }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-medium text-gray-900">{description}</p>
        <p className="text-sm text-gray-600">{category} • {date}</p>
      </div>
      <p className={`font-semibold ${amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
        {amount > 0 ? '+' : ''}₪{Math.abs(amount)}
      </p>
    </div>
  );
}

function BillItem({ name, amount, dueDate }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-medium text-gray-900">{name}</p>
        <p className="text-sm text-gray-600">Due {dueDate}</p>
      </div>
      <p className="font-semibold text-gray-900">₪{amount}</p>
    </div>
  );
}

// Placeholder pages
function SettingsPage() {
  return <PlaceholderPage title="Settings" description="Customize your experience" />;
}

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600 mb-6">{description}</p>
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-gray-500">This feature is coming soon!</p>
      </div>
    </div>
  );
}
