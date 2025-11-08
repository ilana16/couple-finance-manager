import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Repeat,
  Calendar,
  Loader2,
  Trash2,
  Play,
  Pause
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

export default function RecurringTransactions() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    categoryId: "",
    accountId: "",
    description: "",
    recurringFrequency: "monthly" as "daily" | "weekly" | "biweekly" | "monthly" | "yearly",
    startDate: new Date().toISOString().split('T')[0],
    notes: ""
  });

  const utils = trpc.useUtils();
  
  // Fetch data
  const { data: recurringTransactions = [], isLoading } = trpc.transactions.listRecurring.useQuery();
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: accounts = [] } = trpc.accounts.list.useQuery();
  
  // Mutations
  const createRecurring = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.transactions.listRecurring.invalidate();
      setIsAddDialogOpen(false);
      setFormData({
        type: "expense",
        amount: "",
        categoryId: "",
        accountId: "",
        description: "",
        recurringFrequency: "monthly",
        startDate: new Date().toISOString().split('T')[0],
        notes: ""
      });
      toast.success("Recurring transaction created successfully!");
    },
    onError: (error) => {
      toast.error("Failed to create recurring transaction");
    }
  });

  const deleteRecurring = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      utils.transactions.listRecurring.invalidate();
      toast.success("Recurring transaction deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete recurring transaction");
    }
  });

  const generateRecurring = trpc.transactions.generateRecurring.useMutation({
    onSuccess: (result) => {
      utils.transactions.list.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success(`Generated ${result.generated} projected transactions for the next 3 months!`);
    },
    onError: () => {
      toast.error("Failed to generate recurring transactions");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.accountId || !formData.categoryId || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    createRecurring.mutate({
      accountId: parseInt(formData.accountId),
      categoryId: parseInt(formData.categoryId),
      amount: formData.amount,
      type: formData.type,
      description: formData.description,
      date: new Date(formData.startDate),
      notes: formData.notes || undefined,
      isRecurring: true,
      recurringFrequency: formData.recurringFrequency,
      isProjected: true, // Recurring transactions are projected by default
    });
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const selectedCategories = formData.type === 'income' ? incomeCategories : expenseCategories;

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      daily: "Daily",
      weekly: "Weekly",
      biweekly: "Bi-weekly",
      monthly: "Monthly",
      yearly: "Yearly"
    };
    return labels[freq] || freq;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recurring Transactions</h1>
            <p className="text-gray-500 mt-1">Manage automatic recurring bills and income</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => generateRecurring.mutate()}
              disabled={generateRecurring.isPending || recurringTransactions.length === 0}
            >
              {generateRecurring.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Generate Future Transactions
                </>
              )}
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Recurring
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Repeat className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">How Recurring Transactions Work</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Recurring transactions automatically create projected transactions based on your schedule. 
                  These help you plan for regular bills, subscriptions, and income without manual entry each time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recurring Transactions List */}
        {recurringTransactions.length === 0 ? (
          <Card className="p-12 text-center">
            <Repeat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Recurring Transactions</h3>
            <p className="text-gray-500 mb-6">Set up automatic recurring bills and income</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Recurring Transaction
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recurringTransactions.map((transaction) => (
              <Card key={transaction.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{transaction.description || 'Recurring Transaction'}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4" />
                        {transaction.recurringFrequency && getFrequencyLabel(transaction.recurringFrequency)}
                      </CardDescription>
                    </div>
                    <div className={`text-xl font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(transaction.amount))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Type</span>
                      <span className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Next Date</span>
                      <span className="font-medium text-gray-900">
                        {new Date(transaction.date).toLocaleDateString()}
                      </span>
                    </div>
                    {transaction.notes && (
                      <div className="text-sm text-gray-600 pt-2 border-t">
                        {transaction.notes}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => deleteRecurring.mutate({ id: transaction.id })}
                        disabled={deleteRecurring.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Recurring Transaction Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Recurring Transaction</DialogTitle>
              <DialogDescription>
                Create an automatic recurring bill or income
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(value: "income" | "expense") => setFormData({...formData, type: value, categoryId: ""})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="e.g., Netflix Subscription"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Select
                    value={formData.recurringFrequency}
                    onValueChange={(value: "daily" | "weekly" | "biweekly" | "monthly" | "yearly") =>
                      setFormData({...formData, recurringFrequency: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({...formData, categoryId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account">Account *</Label>
                <Select value={formData.accountId} onValueChange={(value) => setFormData({...formData, accountId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id.toString()}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createRecurring.isPending}
                >
                  {createRecurring.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Recurring"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
