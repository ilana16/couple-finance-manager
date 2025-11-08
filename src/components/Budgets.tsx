import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  PieChart,
  Edit,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { formatCurrency } from "@/lib/currency";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Budgets() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<"50-30-20" | "zero-based" | null>(null);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [formData, setFormData] = useState({
    categoryId: "",
    amount: "",
    period: "monthly" as "weekly" | "monthly" | "yearly",
    alertThreshold: "80",
  });

  const utils = trpc.useUtils();
  
  // Fetch data
  const { data: budgets = [], isLoading } = trpc.budgets.list.useQuery();
  const { data: categories = [] } = trpc.categories.list.useQuery();

  // Mutations
  const createBudget = trpc.budgets.create.useMutation({
    onSuccess: () => {
      utils.budgets.list.invalidate();
      setIsAddDialogOpen(false);
      setFormData({
        categoryId: "",
        amount: "",
        period: "monthly",
        alertThreshold: "80",
      });
      toast.success("Budget created successfully!");
    },
    onError: () => {
      toast.error("Failed to create budget");
    }
  });

  const updateBudget = trpc.budgets.update.useMutation({
    onSuccess: () => {
      utils.budgets.list.invalidate();
      setIsEditDialogOpen(false);
      setEditingBudget(null);
      setFormData({
        categoryId: "",
        amount: "",
        period: "monthly",
        alertThreshold: "80",
      });
      toast.success("Budget updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update budget");
    }
  });

  const deleteBudget = trpc.budgets.delete.useMutation({
    onSuccess: () => {
      utils.budgets.list.invalidate();
      toast.success("Budget deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete budget");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    createBudget.mutate({
      categoryId: parseInt(formData.categoryId),
      amount: formData.amount,
      period: formData.period,
      startDate,
      alertThreshold: parseInt(formData.alertThreshold),
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingBudget || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    updateBudget.mutate({
      id: editingBudget.id,
      amount: formData.amount,
      period: formData.period,
      alertThreshold: parseInt(formData.alertThreshold),
    });
  };

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId.toString(),
      amount: budget.amount,
      period: budget.period,
      alertThreshold: budget.alertThreshold?.toString() || "80",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number, categoryName: string) => {
    if (confirm(`Are you sure you want to delete the budget for "${categoryName}"?`)) {
      deleteBudget.mutate({ id });
    }
  };

  // Calculate totals (this would need actual spending data from transactions)
  const totalBudgeted = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
  const totalSpent = 0; // TODO: Calculate from transactions
  const overallProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const getBudgetStatus = (spent: number, budgeted: number) => {
    const percentage = (spent / budgeted) * 100;
    if (percentage >= 100) return { status: "exceeded", color: "text-red-600", icon: AlertCircle };
    if (percentage >= 80) return { status: "warning", color: "text-yellow-600", icon: AlertCircle };
    return { status: "good", color: "text-green-600", icon: CheckCircle };
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const applyTemplate = () => {
    if (!monthlyIncome || !selectedTemplate) return;

    const income = parseFloat(monthlyIncome);
    let budgetsToCreate: Array<{ categoryName: string; amount: number; percentage?: number }> = [];

    if (selectedTemplate === "50-30-20") {
      // Map categories to 50/30/20 buckets
      const needsCategories = expenseCategories.filter(c => 
        ['Housing', 'Groceries', 'Utilities', 'Transportation', 'Healthcare'].includes(c.name)
      );
      const wantsCategories = expenseCategories.filter(c => 
        ['Entertainment', 'Dining Out', 'Shopping', 'Hobbies'].includes(c.name)
      );
      
      const needsAmount = income * 0.5;
      const wantsAmount = income * 0.3;
      
      // Distribute needs budget evenly
      if (needsCategories.length > 0) {
        const perNeed = needsAmount / needsCategories.length;
        needsCategories.forEach(cat => {
          budgetsToCreate.push({ categoryName: cat.name, amount: perNeed, percentage: 50 });
        });
      }
      
      // Distribute wants budget evenly
      if (wantsCategories.length > 0) {
        const perWant = wantsAmount / wantsCategories.length;
        wantsCategories.forEach(cat => {
          budgetsToCreate.push({ categoryName: cat.name, amount: perWant, percentage: 30 });
        });
      }
      
      toast.success(`Applied 50/30/20 rule! Needs: ${formatCurrency(needsAmount)}, Wants: ${formatCurrency(wantsAmount)}, Savings: ${formatCurrency(income * 0.2)}`);
    } else if (selectedTemplate === "zero-based") {
      // Distribute income evenly across all expense categories
      if (expenseCategories.length > 0) {
        const perCategory = income / expenseCategories.length;
        expenseCategories.forEach(cat => {
          budgetsToCreate.push({ categoryName: cat.name, amount: perCategory });
        });
      }
      toast.success(`Applied zero-based budgeting! ${formatCurrency(income)} allocated across ${expenseCategories.length} categories`);
    }

    // Create budgets
    budgetsToCreate.forEach(({ categoryName, amount }) => {
      const category = expenseCategories.find(c => c.name === categoryName);
      if (category) {
        createBudget.mutate({
          categoryId: category.id,
          amount: amount.toFixed(2),
          period: "monthly",
          startDate: new Date(),
          alertThreshold: 80
        });
      }
    });

    // Close dialog
    setIsTemplateDialogOpen(false);
    setSelectedTemplate(null);
    setMonthlyIncome("");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
            <p className="text-gray-500 mt-1">Plan and track your spending by category</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsTemplateDialogOpen(true)}
            >
              <PieChart className="w-4 h-4 mr-2" />
              Use Template
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Budget</DialogTitle>
                <DialogDescription>
                  Set a spending limit for a category
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({...formData, categoryId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No categories found</div>
                      ) : (
                        expenseCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Budget Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Period *</Label>
                  <Select value={formData.period} onValueChange={(value: "weekly" | "monthly" | "yearly") => setFormData({...formData, period: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alert">Alert Threshold (%)</Label>
                  <Input
                    id="alert"
                    type="number"
                    value={formData.alertThreshold}
                    onChange={(e) => setFormData({...formData, alertThreshold: e.target.value})}
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500">Get notified when spending reaches this percentage</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={createBudget.isPending}>
                    {createBudget.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Budget"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Edit Budget Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Budget</DialogTitle>
              <DialogDescription>
                Update spending limit for {categories.find(c => c.id === editingBudget?.categoryId)?.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Budget Amount *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-period">Period *</Label>
                <Select value={formData.period} onValueChange={(value: "weekly" | "monthly" | "yearly") => setFormData({...formData, period: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-alert">Alert Threshold (%)</Label>
                <Input
                  id="edit-alert"
                  type="number"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData({...formData, alertThreshold: e.target.value})}
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500">Get notified when spending reaches this percentage</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={updateBudget.isPending}>
                  {updateBudget.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Budget"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        ) : budgets.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No budgets yet</p>
                <p className="text-sm text-gray-400 mb-6">Create your first budget to start tracking spending</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  Create Your First Budget
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overall Progress */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Overall Budget</CardTitle>
                    <CardDescription>Total spending across all categories</CardDescription>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    ${totalSpent.toFixed(2)}
                  </span>
                  <span className="text-lg text-gray-500">
                    of ${totalBudgeted.toFixed(2)}
                  </span>
                </div>
                <Progress value={overallProgress} className="h-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {overallProgress.toFixed(1)}% used
                  </span>
                  <span className={overallProgress >= 100 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                    ${(totalBudgeted - totalSpent).toFixed(2)} remaining
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Budget Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {budgets.map((budget) => {
                const category = categories.find(c => c.id === budget.categoryId);
                const spent = 0; // TODO: Calculate from transactions
                const budgetAmount = parseFloat(budget.amount);
                const percentage = (spent / budgetAmount) * 100;
                const status = getBudgetStatus(spent, budgetAmount);
                const StatusIcon = status.icon;

                return (
                  <Card key={budget.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{category?.name || 'Unknown Category'}</CardTitle>
                          <CardDescription className="capitalize">{budget.period}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-5 h-5 ${status.color}`} />
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(budget)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(budget.id, category?.name || 'Unknown')}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-gray-900">
                          ${spent.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">
                          of ${budgetAmount.toFixed(2)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className={status.color}>
                          {percentage.toFixed(1)}% used
                        </span>
                        {percentage < 100 ? (
                          <span className="text-gray-600">
                            ${(budgetAmount - spent).toFixed(2)} left
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">
                            ${(spent - budgetAmount).toFixed(2)} over
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Budget Tips */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">Budget Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-blue-800">
                <p>• Review your budgets monthly and adjust based on your spending patterns</p>
                <p>• Set realistic budgets based on your past 3-6 months of expenses</p>
                <p>• Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings</p>
                <p>• Enable alerts to get notified before you exceed your budget</p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Budget Template Dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Apply Budget Template</DialogTitle>
              <DialogDescription>
                Choose a proven budgeting method to quickly set up your monthly budgets
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {/* Income Input */}
              <div className="space-y-2">
                <Label htmlFor="income">Monthly Income (₪) *</Label>
                <Input
                  id="income"
                  type="number"
                  step="0.01"
                  placeholder="Enter your monthly income"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  required
                />
              </div>

              {/* Template Selection */}
              <div className="space-y-4">
                <Label>Select Template</Label>
                
                {/* 50/30/20 Rule */}
                <Card 
                  className={`cursor-pointer transition-all ${
                    selectedTemplate === "50-30-20" 
                      ? "border-blue-500 bg-blue-50" 
                      : "hover:border-gray-400"
                  }`}
                  onClick={() => setSelectedTemplate("50-30-20")}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">50/30/20 Rule</CardTitle>
                    <CardDescription>
                      A balanced approach to budgeting
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>• 50% Needs (Housing, Food, Utilities)</span>
                      <span className="font-medium">
                        {monthlyIncome ? formatCurrency(parseFloat(monthlyIncome) * 0.5) : "₪0"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• 30% Wants (Entertainment, Dining Out)</span>
                      <span className="font-medium">
                        {monthlyIncome ? formatCurrency(parseFloat(monthlyIncome) * 0.3) : "₪0"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• 20% Savings & Debt</span>
                      <span className="font-medium">
                        {monthlyIncome ? formatCurrency(parseFloat(monthlyIncome) * 0.2) : "₪0"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Zero-Based Budgeting */}
                <Card 
                  className={`cursor-pointer transition-all ${
                    selectedTemplate === "zero-based" 
                      ? "border-blue-500 bg-blue-50" 
                      : "hover:border-gray-400"
                  }`}
                  onClick={() => setSelectedTemplate("zero-based")}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">Zero-Based Budgeting</CardTitle>
                    <CardDescription>
                      Every shekel has a purpose
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>Allocate 100% of your income across all expense categories, ensuring every shekel is accounted for. This method promotes intentional spending and helps identify areas for optimization.</p>
                    <div className="flex items-center justify-between font-medium pt-2 border-t">
                      <span>Total to Allocate:</span>
                      <span>{monthlyIncome ? formatCurrency(parseFloat(monthlyIncome)) : "₪0"}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Apply Button */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsTemplateDialogOpen(false);
                    setSelectedTemplate(null);
                    setMonthlyIncome("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!monthlyIncome || !selectedTemplate) {
                      toast.error("Please enter income and select a template");
                      return;
                    }
                    applyTemplate();
                  }}
                  disabled={!monthlyIncome || !selectedTemplate}
                >
                  Apply Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
