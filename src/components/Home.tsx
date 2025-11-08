import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  CreditCard,
  Clock,
  Calendar,
  Loader2,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { formatCurrency } from "@/lib/currency";
import { Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function CurrencySelector() {
  const [currency, setCurrency] = useState("ILS");
  const { data: supportedCurrencies } = trpc.currency.supported.useQuery();

  return (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {supportedCurrencies?.map((curr) => (
          <SelectItem key={curr.code} value={curr.code}>
            {curr.symbol} {curr.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AlertsNotification() {
  const [, setLocation] = useLocation();
  const { data: unreadCount } = trpc.alerts.unreadCount.useQuery();

  return (
    <Button
      variant="outline"
      size="icon"
      className="relative"
      onClick={() => setLocation('/settings')}
    >
      <Bell className="w-4 h-4" />
      {unreadCount && unreadCount > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600">
          {unreadCount}
        </Badge>
      )}
    </Button>
  );
}

function PendingApprovalsWidget() {
  const [, setLocation] = useLocation();
  const { data: pendingApprovals, isLoading } = trpc.transactions.pendingApprovals.useQuery();
  const utils = trpc.useUtils();

  const approveTransaction = trpc.transactions.approveTransaction.useMutation({
    onSuccess: () => {
      utils.transactions.pendingApprovals.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success('Transaction approved');
    },
    onError: () => toast.error('Failed to approve transaction')
  });

  if (isLoading) return null;
  if (!pendingApprovals || pendingApprovals.length === 0) return null;

  return (
    <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <CardTitle className="text-yellow-900">Pending Approvals</CardTitle>
          </div>
          <span className="bg-yellow-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
            {pendingApprovals.length}
          </span>
        </div>
        <CardDescription>Transactions awaiting your approval</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingApprovals.slice(0, 3).map((tx: any) => (
          <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-yellow-200">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{tx.description || 'No description'}</p>
              <p className="text-sm text-gray-500">
                {new Date(tx.date).toLocaleDateString()} • {tx.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(tx.amount))}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => approveTransaction.mutate({ id: tx.id, approve: false })}
              >
                Reject
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => approveTransaction.mutate({ id: tx.id, approve: true })}
              >
                Approve
              </Button>
            </div>
          </div>
        ))}
        {pendingApprovals.length > 3 && (
          <Button variant="outline" className="w-full" onClick={() => setLocation('/transactions')}>
            View All {pendingApprovals.length} Pending
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function FinancialHealthScoreWidget() {
  const { data: healthData, isLoading } = trpc.dashboard.healthScore.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthData) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-blue-100";
    if (score >= 40) return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="text-blue-900">Financial Health Score</CardTitle>
        <CardDescription>Based on savings rate, debt-to-income, and budget adherence</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="flex items-center justify-center">
          <div className={`relative w-32 h-32 rounded-full ${getScoreBgColor(healthData.score)} flex items-center justify-center`}>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(healthData.score)}`}>
                {healthData.score}
              </div>
              <div className="text-xs text-gray-600 mt-1">{healthData.grade}</div>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Savings Rate</span>
            <span className="font-medium">
              {healthData.breakdown.savingsRate.score}/{healthData.breakdown.savingsRate.maxScore}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${(healthData.breakdown.savingsRate.score / healthData.breakdown.savingsRate.maxScore) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">{healthData.breakdown.savingsRate.label}</p>

          <div className="flex items-center justify-between text-sm pt-2">
            <span className="text-gray-600">Debt-to-Income</span>
            <span className="font-medium">
              {healthData.breakdown.debtToIncome.score}/{healthData.breakdown.debtToIncome.maxScore}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(healthData.breakdown.debtToIncome.score / healthData.breakdown.debtToIncome.maxScore) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">{healthData.breakdown.debtToIncome.label}</p>

          <div className="flex items-center justify-between text-sm pt-2">
            <span className="text-gray-600">Budget Adherence</span>
            <span className="font-medium">
              {healthData.breakdown.budgetAdherence.score}/{healthData.breakdown.budgetAdherence.maxScore}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${(healthData.breakdown.budgetAdherence.score / healthData.breakdown.budgetAdherence.maxScore) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">{healthData.breakdown.budgetAdherence.label}</p>
        </div>

        {/* Improvement Tips */}
        {healthData.tips.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Improvement Tips</h4>
            {healthData.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <p className="text-sm text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AIInsightsWidget() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: insights, isLoading, refetch } = trpc.dashboard.insights.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-purple-900">AI Financial Insights</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>Personalized recommendations based on your spending patterns</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin h-8 w-8 text-purple-600" />
          </div>
        ) : insights?.insights && insights.insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.insights.map((insight: any, index: number) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 border border-purple-100 hover:border-purple-300 transition-colors"
              >
                <h4 className="font-semibold text-gray-900 mb-2 flex items-start gap-2">
                  <span className="text-purple-600 text-lg">•</span>
                  {insight.title}
                </h4>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Add some transactions to get personalized insights!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading } = trpc.dashboard.summary.useQuery();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  // Currency formatting is now imported from @/lib/currency

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <CurrencySelector />
            <AlertsNotification />
            <Button onClick={() => setLocation("/transactions")} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Projected Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Projected</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Projected Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary?.projectedIncome || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Expected this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Projected Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary?.projectedExpenses || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Expected this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Projected Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(summary?.projectedBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary?.projectedBalance || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Income minus expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Days Remaining
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {summary?.daysRemaining || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Days left in month</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actual Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Actual</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Actual Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary?.actualIncome || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Received so far</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Actual Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary?.actualExpenses || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Spent so far</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Actual Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(summary?.actualBalance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary?.actualBalance || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Current balance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Savings Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {summary?.savingsRate || 0}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Of income saved</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Flexible Balance Section */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-blue-900">Flexible Balance</CardTitle>
            </div>
            <CardDescription className="text-blue-700">
              Available spending after pending transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-2">Monthly Average</p>
                <p className="text-3xl font-bold text-blue-900">
                  {formatCurrency(summary?.flexibleBalance || 0)}
                </p>
                <p className="text-xs text-blue-600 mt-1">Remaining for the month</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700 mb-2">Weekly Average</p>
                <p className="text-3xl font-bold text-blue-900">
                  {formatCurrency(summary?.weeklyFlexibleBalance || 0)}
                </p>
                <p className="text-xs text-blue-600 mt-1">Per week remaining</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700 mb-2">Daily Average</p>
                <p className="text-3xl font-bold text-blue-900">
                  {formatCurrency(summary?.dailyFlexibleBalance || 0)}
                </p>
                <p className="text-xs text-blue-600 mt-1">Per day remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Transactions & Credit */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <CardTitle>Pending Transactions</CardTitle>
              </div>
              <CardDescription>
                Transactions awaiting processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ArrowDownRight className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">Pending Debits</p>
                    <p className="text-xs text-gray-500">Expenses to be charged</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(summary?.pendingDebits || 0)}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ArrowUpRight className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Pending Credits</p>
                    <p className="text-xs text-gray-500">Payments to receive</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(summary?.pendingCredits || 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Credit Availability */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <CardTitle>Credit Availability</CardTitle>
              </div>
              <CardDescription>
                Your available credit lines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Total Credit Limit</p>
                  <p className="text-xs text-gray-500">Across all credit accounts</p>
                </div>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(summary?.totalCreditLimit || 0)}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Available Credit</p>
                  <p className="text-xs text-gray-500">Currently available to use</p>
                </div>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(summary?.totalAvailableCredit || 0)}
                </p>
              </div>

              {(summary?.totalCreditLimit || 0) > 0 && (
                <div className="pt-2">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Credit Utilization</span>
                    <span className="font-medium">
                      {((1 - (summary?.totalAvailableCredit || 0) / (summary?.totalCreditLimit || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, ((1 - (summary?.totalAvailableCredit || 0) / (summary?.totalCreditLimit || 1)) * 100))}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Insights and Health Score */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIInsightsWidget />
          <FinancialHealthScoreWidget />
        </div>

        {/* Pending Approvals */}
        <PendingApprovalsWidget />

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest financial activity</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setLocation("/transactions")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!summary?.recentTransactions || summary.recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No transactions yet</p>
                <Button onClick={() => setLocation("/transactions")}>
                  Add Your First Transaction
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.recentTransactions.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description || 'Transaction'}</p>
                        <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(parseFloat(transaction.amount)))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/goals")}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Savings Goals</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Track your progress toward financial goals</p>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary?.totalGoalCurrent || 0)}
                </p>
                <p className="text-xs text-gray-500">of {formatCurrency(summary?.totalGoalTarget || 0)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/debts")}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-600" />
                <CardTitle className="text-lg">Debt Payoff</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Calculate and track your debt payoff plan</p>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary?.totalDebt || 0)}
                </p>
                <p className="text-xs text-gray-500">total debt remaining</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/budgets")}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <CardTitle className="text-lg">Budget Planner</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Create and manage your monthly budgets</p>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  Manage Budgets
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
