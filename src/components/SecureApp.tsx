import React, { useState, useEffect } from 'react';
import { AuthProvider, ProtectedRoute, useAuth } from '../lib/auth';
import { transactionStorage, reminderStorage, accountStorage, creditStorage } from '../lib/storage';
import SidebarLayout from '../layouts/SidebarLayout';
import EnhancedBudgets from './EnhancedBudgets';
import { FinancialHealthPage } from './FinancialHealthWidget';
import { ReimbursementManagementPage } from './ReimbursementWidget';
import TransactionsPage from './TransactionsPage';
import GoalsPage from './GoalsPage';
import DebtsPage from './DebtsPage';
import InvestmentsPage from './InvestmentsPage';
import AccountsPage from './AccountsPage';
import CreditPage from './CreditPage';
import ReportsPage from './ReportsPage';
import NotesPage from './NotesPage';
import RemindersPage from './RemindersPage';
import SettingsPage from './SettingsPage';


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
      case 'accounts':
        return <AccountsPage />;
      case 'credit':
        return <CreditPage />;
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
  const [stats, setStats] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0,
    totalAccounts: 0,
    totalCredit: 0,
    availableCredit: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user, viewMode]);

  const loadDashboardData = () => {
    if (!user) return;
    const includeJoint = viewMode === 'joint';

    // Load accounts
    const accounts = accountStorage.getByUser(user.id, includeJoint);
    const totalAccountBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    
    // Load credit sources
    const credits = creditStorage.getByUser(user.id, includeJoint);
    const totalCreditBalance = credits.reduce((sum, c) => sum + c.currentBalance, 0);
    const totalAvailableCredit = credits.reduce((sum, c) => sum + c.availableCredit, 0);
    
    // Load transactions
    const transactions = transactionStorage.getByUser(user.id, includeJoint);
    const sortedTransactions = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    setRecentTransactions(sortedTransactions);

    // Calculate stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = transactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);

    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    setStats({
      totalBalance: totalAccountBalance,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      savingsRate,
      totalAccounts: accounts.length,
      totalCredit: totalCreditBalance,
      availableCredit: totalAvailableCredit,
    });

    // Load upcoming reminders
    const reminders = reminderStorage.getAll()
      .filter(r => !r.isCompleted && new Date(r.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3);
    setUpcomingReminders(reminders);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  const formatDueDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
        <StatCard 
          title="Total Balance" 
          value={`₪${stats.totalBalance.toFixed(2)}`} 
          change={stats.totalBalance >= 0 ? 'Positive' : 'Negative'} 
          positive={stats.totalBalance >= 0} 
        />
        <StatCard 
          title="Monthly Income" 
          value={`₪${stats.monthlyIncome.toFixed(2)}`} 
          change="This Month" 
          positive 
        />
        <StatCard 
          title="Monthly Expenses" 
          value={`₪${stats.monthlyExpenses.toFixed(2)}`} 
          change="This Month" 
          positive={stats.monthlyExpenses < stats.monthlyIncome} 
        />
        <StatCard 
          title="Savings Rate" 
          value={`${stats.savingsRate.toFixed(1)}%`} 
          change={stats.savingsRate > 0 ? 'Saving' : 'Deficit'} 
          positive={stats.savingsRate > 0} 
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map(t => (
                <TransactionItem
                  key={t.id}
                  description={t.description}
                  amount={t.type === 'income' ? t.amount : -t.amount}
                  category={t.category}
                  date={formatDate(t.date)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Reminders</h2>
          {upcomingReminders.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No upcoming reminders</p>
          ) : (
            <div className="space-y-3">
              {upcomingReminders.map(r => (
                <BillItem 
                  key={r.id}
                  name={r.title} 
                  amount={0} 
                  dueDate={formatDueDate(r.dueDate)} 
                />
              ))}
            </div>
          )}
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
