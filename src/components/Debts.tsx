import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  CreditCard,
  AlertCircle,
  TrendingDown,
  Calendar,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/currency";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Debts() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "credit_card",
    originalAmount: "",
    currentBalance: "",
    interestRate: "",
    minimumPayment: "",
    dueDate: "",
    ownership: "joint" as "joint" | "individual",
  });

  const { data: debts, isLoading, refetch } = trpc.debts.list.useQuery();
  const createMutation = trpc.debts.create.useMutation({
    onSuccess: () => {
      toast.success("Debt added successfully");
      setIsAddDialogOpen(false);
      refetch();
      setFormData({
        name: "",
        type: "credit_card",
        originalAmount: "",
        currentBalance: "",
        interestRate: "",
        minimumPayment: "",
        dueDate: "",
        ownership: "joint",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add debt");
    },
  });

  const updateMutation = trpc.debts.update.useMutation({
    onSuccess: () => {
      toast.success("Debt updated successfully");
      setIsEditDialogOpen(false);
      setEditingDebt(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update debt");
    },
  });

  const deleteMutation = trpc.debts.delete.useMutation({
    onSuccess: () => {
      toast.success("Debt deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete debt");
    },
  });

  const handleEdit = (debt: any) => {
    setEditingDebt(debt);
    setFormData({
      name: debt.name,
      type: debt.type,
      originalAmount: debt.originalAmount,
      currentBalance: debt.currentBalance,
      interestRate: debt.interestRate || "",
      minimumPayment: debt.minimumPayment || "",
      dueDate: debt.dueDate ? debt.dueDate.toString() : "",
      ownership: debt.ownership,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      type: formData.type as any,
      originalAmount: formData.originalAmount,
      currentBalance: formData.currentBalance,
      interestRate: formData.interestRate || undefined,
      minimumPayment: formData.minimumPayment || undefined,
      dueDate: formData.dueDate ? parseInt(formData.dueDate) : undefined,
      ownership: formData.ownership,
    });
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

  const totalOriginal = debts?.reduce((sum, d) => sum + parseFloat(d.originalAmount), 0) || 0;
  const totalCurrent = debts?.reduce((sum, d) => sum + parseFloat(d.currentBalance), 0) || 0;
  const totalPaid = totalOriginal - totalCurrent;
  const overallProgress = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0;
  const totalMinimumPayment = debts?.reduce((sum, d) => sum + (d.minimumPayment ? parseFloat(d.minimumPayment) : 0), 0) || 0;

  const getDebtTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const calculatePayoffMonths = (balance: number, payment: number, rate: number) => {
    if (payment <= 0 || rate < 0) return 0;
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) return Math.ceil(balance / payment);
    const months = Math.log(payment / (payment - balance * monthlyRate)) / Math.log(1 + monthlyRate);
    return Math.ceil(months);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Debt Management</h1>
            <p className="text-gray-500 mt-1">Track and pay off your debts strategically</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Debt
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Debt</DialogTitle>
                <DialogDescription>
                  Track a new debt to manage your payoff plan
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Debt Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Credit Card - Visa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="student_loan">Student Loan</SelectItem>
                      <SelectItem value="car_loan">Car Loan</SelectItem>
                      <SelectItem value="mortgage">Mortgage</SelectItem>
                      <SelectItem value="personal_loan">Personal Loan</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="original">Original Amount</Label>
                    <Input
                      id="original"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="current">Current Balance</Label>
                    <Input
                      id="current"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate">Interest Rate (%)</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minimum">Minimum Payment</Label>
                    <Input
                      id="minimum"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date (Day of Month)</Label>
                  <Input
                    id="dueDate"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="15"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownership">Ownership</Label>
                  <Select defaultValue="joint">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="joint">Joint</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    Add Debt
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

          {/* Edit Debt Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Debt</DialogTitle>
                <DialogDescription>
                  Update your debt information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (editingDebt) {
                  updateMutation.mutate({
                    id: editingDebt.id,
                    name: formData.name,
                    currentBalance: formData.currentBalance,
                    interestRate: formData.interestRate || undefined,
                    minimumPayment: formData.minimumPayment || undefined,
                    dueDate: formData.dueDate ? parseInt(formData.dueDate) : undefined,
                  });
                }
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Debt Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Credit Card"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-type">Debt Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="edit-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="student_loan">Student Loan</SelectItem>
                      <SelectItem value="car_loan">Car Loan</SelectItem>
                      <SelectItem value="mortgage">Mortgage</SelectItem>
                      <SelectItem value="personal_loan">Personal Loan</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-original">Original Amount</Label>
                    <Input
                      id="edit-original"
                      type="number"
                      step="0.01"
                      value={formData.originalAmount}
                      onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-current">Current Balance</Label>
                    <Input
                      id="edit-current"
                      type="number"
                      step="0.01"
                      value={formData.currentBalance}
                      onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-rate">Interest Rate (%)</Label>
                    <Input
                      id="edit-rate"
                      type="number"
                      step="0.01"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-minimum">Minimum Payment</Label>
                    <Input
                      id="edit-minimum"
                      type="number"
                      step="0.01"
                      value={formData.minimumPayment}
                      onChange={(e) => setFormData({ ...formData, minimumPayment: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-dueDate">Due Date (Day of Month)</Label>
                  <Input
                    id="edit-dueDate"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    placeholder="15"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Debt
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overall Debt Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Debt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalCurrent)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Paid Off
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {overallProgress.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Min. Monthly Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalMinimumPayment)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debt Payoff Strategy */}
        <Card>
          <CardHeader>
            <CardTitle>Payoff Strategy</CardTitle>
            <CardDescription>Choose how to prioritize your debt payments</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="snowball" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="snowball">Snowball</TabsTrigger>
                <TabsTrigger value="avalanche">Avalanche</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
              <TabsContent value="snowball" className="space-y-4 mt-4">
                <p className="text-sm text-gray-600">
                  Pay off debts from smallest to largest balance, regardless of interest rate. 
                  This method provides quick wins and psychological motivation.
                </p>
              </TabsContent>
              <TabsContent value="avalanche" className="space-y-4 mt-4">
                <p className="text-sm text-gray-600">
                  Pay off debts from highest to lowest interest rate. 
                  This method saves the most money on interest over time.
                </p>
              </TabsContent>
              <TabsContent value="custom" className="space-y-4 mt-4">
                <p className="text-sm text-gray-600">
                  Create your own custom payoff order based on your priorities and circumstances.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Debts List */}
        <div className="space-y-4">
          {!debts || debts.length === 0 ? (
            <Card className="p-12 text-center">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Debts Tracked</h3>
              <p className="text-gray-500 mb-6">Start tracking your debts to manage payoff strategies</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Debt
              </Button>
            </Card>
          ) : (
            debts.map((debt) => {
                  const original = parseFloat(debt.originalAmount);
                  const current = parseFloat(debt.currentBalance);
                  const paidOff = original - current;
                  const progress = original > 0 ? (paidOff / original) * 100 : 0;
            const payoffMonths = calculatePayoffMonths(
              current,
              debt.minimumPayment ? parseFloat(debt.minimumPayment) : 0,
              debt.interestRate ? parseFloat(debt.interestRate) : 0
            );

            return (
              <Card key={debt.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{debt.name}</CardTitle>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
                          {getDebtTypeLabel(debt.type)}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                          {debt.ownership === "joint" ? "Joint" : "Individual"}
                        </span>
                      </div>
                    </div>
                    <CreditCard className="w-6 h-6 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Current Balance</p>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(parseFloat(debt.currentBalance))}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Interest Rate</p>
                      <p className="text-lg font-bold text-gray-900">{debt.interestRate ? parseFloat(debt.interestRate).toFixed(2) : '0.00'}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Min. Payment</p>
                      <p className="text-lg font-bold text-gray-900">{debt.minimumPayment ? formatCurrency(parseFloat(debt.minimumPayment)) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Due Date</p>
                      <p className="text-lg font-bold text-gray-900">{debt.dueDate ? `${debt.dueDate}th` : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Payoff Progress</span>
                      <span className="font-medium text-gray-900">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{formatCurrency(paidOff)} paid</span>
                      <span>{formatCurrency(parseFloat(debt.currentBalance))} remaining</span>
                    </div>
                  </div>

                  {payoffMonths > 0 && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Payoff in {payoffMonths} months with minimum payments
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEdit(debt)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(debt.id, debt.name)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
          )}
        </div>

        {/* Debt Tips */}
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-red-900">Debt Payoff Tips</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-red-800">
            <p>• Always pay at least the minimum on all debts to avoid penalties</p>
            <p>• Consider debt consolidation if you have multiple high-interest debts</p>
            <p>• Put any extra money toward the highest priority debt in your strategy</p>
            <p>• Avoid taking on new debt while paying off existing balances</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
