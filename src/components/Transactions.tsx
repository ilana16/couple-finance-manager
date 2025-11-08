import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Trash2,
  Loader2,
  Wallet,
  Upload,
  Paperclip,
  X
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

export default function Transactions() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "projected" | "pending" | "actual" | "recurring">("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [amountRange, setAmountRange] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ categoryId: number | null; categoryName: string; confidence: number; reason: string } | null>(null);
  const [suggestingCategory, setSuggestingCategory] = useState(false);
  const [scanningReceipt, setScanningReceipt] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    categoryId: "",
    accountId: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    notes: "",
    isPending: false,
    isProjected: false,
    isRecurring: false,
    recurringFrequency: "" as "" | "daily" | "weekly" | "biweekly" | "monthly" | "yearly",
    attachments: [] as Array<{ url: string; filename: string }>
  });

  const utils = trpc.useUtils();
  
  // Fetch data
  const { data: transactions = [], isLoading } = trpc.transactions.list.useQuery();
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const { data: accounts = [] } = trpc.accounts.list.useQuery();
  
  // Auto-create default account if none exists
  const ensureDefaultAccount = trpc.accounts.ensureDefault.useMutation({
    onSuccess: () => {
      utils.accounts.list.invalidate();
    }
  });
  
  // Ensure default account exists when dialog opens
  const handleDialogOpen = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (open && accounts.length === 0) {
      ensureDefaultAccount.mutate();
    }
  };

  // Mutations
  const uploadAttachment = trpc.transactions.uploadAttachment.useMutation();
  
  const suggestCategory = trpc.transactions.suggestCategory.useMutation({
    onSuccess: (data) => {
      setAiSuggestion(data);
      setSuggestingCategory(false);
      if (data.categoryId) {
        toast.success(`Suggested: ${data.categoryName} (${data.confidence}% confidence)`);
      } else {
        toast.info("Could not find matching category");
      }
    },
    onError: () => {
      setSuggestingCategory(false);
      toast.error("Failed to get AI suggestion");
    }
  });

  const scanReceipt = trpc.transactions.scanReceipt.useMutation({
    onSuccess: (data) => {
      setScanningReceipt(false);
      
      // Auto-fill form with extracted data
      if (data.amount) {
        setFormData(prev => ({ ...prev, amount: data.amount!.toString() }));
      }
      if (data.date) {
        setFormData(prev => ({ ...prev, date: data.date! }));
      }
      if (data.merchant) {
        setFormData(prev => ({ ...prev, description: data.merchant! }));
      }
      if (data.category) {
        // Find matching category
        const matchingCategory = categories.find(c => 
          c.name.toLowerCase().includes(data.category!.toLowerCase())
        );
        if (matchingCategory) {
          setFormData(prev => ({ ...prev, categoryId: matchingCategory.id.toString() }));
        }
      }

      // Show confidence scores
      const avgConfidence = Math.round(
        (data.confidence.amount + data.confidence.date + data.confidence.merchant + data.confidence.category) / 4
      );
      toast.success(`Receipt scanned! Average confidence: ${avgConfidence}%`);
    },
    onError: (error) => {
      setScanningReceipt(false);
      toast.error(error.message || "Failed to scan receipt");
    }
  });
  
  const createTransaction = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      utils.dashboard.summary.invalidate();
      setIsAddDialogOpen(false);
      setAiSuggestion(null);
      setFormData({
        type: "expense",
        amount: "",
        categoryId: "",
        accountId: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        notes: "",
        isPending: false,
        isProjected: false,
        isRecurring: false,
        recurringFrequency: "",
        attachments: []
      });
      toast.success("Transaction added successfully!");
    },
    onError: (error) => {
      toast.error("Failed to add transaction");
    }
  });

  const updateTransaction = trpc.transactions.update.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      utils.dashboard.summary.invalidate();
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
      toast.success("Transaction updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update transaction");
    }
  });

  const deleteTransaction = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("Transaction deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete transaction");
    }
  });

  const filteredTransactions = transactions.filter(t => {
    // Search filter
    const matchesSearch = t.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    
    // Status filter
    let matchesStatus = true;
    if (statusFilter === "projected") {
      matchesStatus = t.isProjected === true;
    } else if (statusFilter === "pending") {
      matchesStatus = t.isPending === true;
    } else if (statusFilter === "actual") {
      matchesStatus = !t.isProjected && !t.isPending;
    } else if (statusFilter === "recurring") {
      matchesStatus = t.isRecurring === true;
    }
    
    // Date range filter
    let matchesDateRange = true;
    if (dateRange.start && t.date) {
      matchesDateRange = new Date(t.date) >= new Date(dateRange.start);
    }
    if (dateRange.end && t.date && matchesDateRange) {
      matchesDateRange = new Date(t.date) <= new Date(dateRange.end);
    }
    
    // Amount range filter
    let matchesAmountRange = true;
    const amount = Math.abs(parseFloat(t.amount));
    if (amountRange.min && amountRange.min !== "") {
      matchesAmountRange = amount >= parseFloat(amountRange.min);
    }
    if (amountRange.max && amountRange.max !== "" && matchesAmountRange) {
      matchesAmountRange = amount <= parseFloat(amountRange.max);
    }
    
    return matchesSearch && matchesStatus && matchesDateRange && matchesAmountRange;
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpenses = Math.abs(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0));

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTransaction || !formData.accountId || !formData.categoryId || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    updateTransaction.mutate({
      id: editingTransaction.id,
      accountId: parseInt(formData.accountId),
      categoryId: parseInt(formData.categoryId),
      amount: formData.amount,
      type: formData.type,
      description: formData.description,
      date: new Date(formData.date),
      notes: formData.notes || undefined,
      isPending: formData.isPending,
      isProjected: formData.isProjected,
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.isRecurring && formData.recurringFrequency ? formData.recurringFrequency : undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.accountId || !formData.categoryId || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    createTransaction.mutate({
      accountId: parseInt(formData.accountId),
      categoryId: parseInt(formData.categoryId),
      amount: formData.amount,
      type: formData.type,
      description: formData.description,
      date: new Date(formData.date),
      notes: formData.notes || undefined,
      isPending: formData.isPending,
      isProjected: formData.isProjected,
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.recurringFrequency || undefined,
      attachments: formData.attachments.length > 0 ? JSON.stringify(formData.attachments) : undefined,
    });
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const availableCategories = formData.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-500 mt-1">Track and manage your income and expenses</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>
                  Record a new income or expense transaction
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                  <Label htmlFor="amount">Amount *</Label>
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
                  <Label htmlFor="account">Account *</Label>
                  <Select value={formData.accountId} onValueChange={(value) => setFormData({...formData, accountId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No accounts found. Create one first.</div>
                      ) : (
                        accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="category">Category *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!formData.description || !formData.amount) {
                          toast.error("Please enter description and amount first");
                          return;
                        }
                        setSuggestingCategory(true);
                        suggestCategory.mutate({
                          description: formData.description,
                          amount: formData.amount,
                          type: formData.type
                        });
                      }}
                      disabled={suggestingCategory || !formData.description || !formData.amount}
                      className="h-7 text-xs"
                    >
                      {suggestingCategory ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Suggesting...
                        </>
                      ) : (
                        <>✨ AI Suggest</>
                      )}
                    </Button>
                  </div>
                  
                  {aiSuggestion && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-900">
                          Suggested: {aiSuggestion.categoryName}
                        </span>
                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">
                          {aiSuggestion.confidence}% confident
                        </span>
                      </div>
                      <p className="text-xs text-purple-700">{aiSuggestion.reason}</p>
                      {aiSuggestion.categoryId && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setFormData({...formData, categoryId: aiSuggestion.categoryId!.toString()});
                            toast.success("Category applied!");
                          }}
                          className="w-full h-7 text-xs"
                        >
                          Apply Suggestion
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({...formData, categoryId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No categories found</div>
                      ) : (
                        availableCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="e.g., Weekly groceries"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
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

                {/* Transaction Status */}
                <div className="space-y-3 pt-2 border-t">
                  <Label className="text-sm font-semibold">Transaction Status</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isProjected"
                        checked={formData.isProjected}
                        onChange={(e) => setFormData({...formData, isProjected: e.target.checked})}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Label htmlFor="isProjected" className="font-normal cursor-pointer">
                        Projected (Expected future transaction)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPending"
                        checked={formData.isPending}
                        onChange={(e) => setFormData({...formData, isPending: e.target.checked})}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Label htmlFor="isPending" className="font-normal cursor-pointer">
                        Pending (Awaiting processing)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isRecurring"
                        checked={formData.isRecurring}
                        onChange={(e) => setFormData({...formData, isRecurring: e.target.checked, recurringFrequency: e.target.checked ? "monthly" : ""})}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Label htmlFor="isRecurring" className="font-normal cursor-pointer">
                        Recurring transaction
                      </Label>
                    </div>
                  </div>
                  
                  {formData.isRecurring && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="recurringFrequency" className="text-sm">Frequency</Label>
                      <Select
                        value={formData.recurringFrequency}
                        onValueChange={(value: "daily" | "weekly" | "biweekly" | "monthly" | "yearly") =>
                          setFormData({...formData, recurringFrequency: value})
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
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
                  )}
                </div>

                {/* File Attachments */}
                <div className="space-y-2">
                  <Label>Attachments (Optional)</Label>
                  <div className="border-2 border-dashed rounded-lg p-4">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("File size must be less than 5MB");
                          return;
                        }
                        
                        setUploadingFile(true);
                        try {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const base64 = reader.result as string;
                            const result = await uploadAttachment.mutateAsync({
                              file: base64,
                              filename: file.name,
                              mimeType: file.type
                            });
                            
                            setFormData({
                              ...formData,
                              attachments: [...formData.attachments, result]
                            });
                            toast.success("File uploaded successfully");
                          };
                          reader.readAsDataURL(file);
                        } catch (error) {
                          toast.error("Failed to upload file");
                        } finally {
                          setUploadingFile(false);
                        }
                      }}
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">PDF, PNG, JPG (max 5MB)</p>
                    </label>
                    
                    {uploadingFile && (
                      <div className="flex items-center justify-center mt-2">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span className="text-sm">Uploading...</span>
                      </div>
                    )}
                    
                    {formData.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {formData.attachments.map((att, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4" />
                              <span className="text-sm">{att.filename}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  attachments: formData.attachments.filter((_, i) => i !== idx)
                                });
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1" disabled={createTransaction.isPending}>
                    {createTransaction.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Transaction"
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

          {/* Edit Transaction Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Transaction</DialogTitle>
                <DialogDescription>
                  Update transaction details
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value: "income" | "expense") => setFormData({...formData, type: value})}>
                    <SelectTrigger id="edit-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Amount *</Label>
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
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({...formData, categoryId: value})}>
                    <SelectTrigger id="edit-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter(c => c.type === formData.type)
                        .map(category => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-account">Account *</Label>
                  <Select value={formData.accountId} onValueChange={(value) => setFormData({...formData, accountId: value})}>
                    <SelectTrigger id="edit-account">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description *</Label>
                  <Input
                    id="edit-description"
                    placeholder="e.g., Grocery shopping"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    placeholder="Additional notes (optional)"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-pending"
                    checked={formData.isPending}
                    onChange={(e) => setFormData({...formData, isPending: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="edit-pending" className="cursor-pointer">Mark as Pending</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-projected"
                    checked={formData.isProjected}
                    onChange={(e) => setFormData({...formData, isProjected: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="edit-projected" className="cursor-pointer">Mark as Projected</Label>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-recurring"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="edit-recurring" className="cursor-pointer">Recurring Transaction</Label>
                  </div>
                  
                  {formData.isRecurring && (
                    <Select value={formData.recurringFrequency} onValueChange={(value: "daily" | "weekly" | "biweekly" | "monthly" | "yearly") => setFormData({...formData, recurringFrequency: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={updateTransaction.isPending}>
                    {updateTransaction.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Transaction
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Income
              </CardTitle>
              <ArrowUpRight className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{formatCurrency(totalIncome)}
              </div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Expenses
              </CardTitle>
              <ArrowDownRight className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                -{formatCurrency(totalExpenses)}
              </div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Net Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalIncome - totalExpenses)}
              </div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search transactions..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === "actual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("actual")}
                  >
                    Actual
                  </Button>
                  <Button
                    variant={statusFilter === "projected" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("projected")}
                    className="gap-1"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Projected
                  </Button>
                  <Button
                    variant={statusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("pending")}
                    className="gap-1"
                  >
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    Pending
                  </Button>
                  <Button
                    variant={statusFilter === "recurring" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("recurring")}
                    className="gap-1"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Recurring
                  </Button>
                </div>
              </div>
              
              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="date"
                      placeholder="Start date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="flex-1"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="date"
                      placeholder="End date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Amount Range (₪)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={amountRange.min}
                      onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                      className="flex-1"
                      step="0.01"
                    />
                    <span className="text-gray-500">to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={amountRange.max}
                      onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                      className="flex-1"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              
              {/* Clear Filters Button */}
              {(dateRange.start || dateRange.end || amountRange.min || amountRange.max) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateRange({ start: "", end: "" });
                    setAmountRange({ min: "", max: "" });
                  }}
                  className="w-fit"
                >
                  Clear Advanced Filters
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>
                  {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
                  {selectedTransactions.length > 0 && ` • ${selectedTransactions.length} selected`}
                </CardDescription>
              </div>
              {selectedTransactions.length > 0 && (
                <div className="flex gap-2 items-center">
                  <Select
                    onValueChange={(categoryId) => {
                      if (confirm(`Update category for ${selectedTransactions.length} selected transactions?`)) {
                        selectedTransactions.forEach(id => {
                          updateTransaction.mutate({ id, categoryId: parseInt(categoryId) });
                        });
                        setSelectedTransactions([]);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="Bulk Categorize" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{cat.icon}</span>
                            {cat.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    onValueChange={(status) => {
                      if (confirm(`Update status for ${selectedTransactions.length} selected transactions?`)) {
                        const updates: any = {};
                        if (status === "projected") {
                          updates.isProjected = true;
                          updates.isPending = false;
                        } else if (status === "pending") {
                          updates.isPending = true;
                          updates.isProjected = false;
                        } else if (status === "actual") {
                          updates.isProjected = false;
                          updates.isPending = false;
                        }
                        selectedTransactions.forEach(id => {
                          updateTransaction.mutate({ id, ...updates });
                        });
                        setSelectedTransactions([]);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="Change Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="projected">Mark as Projected</SelectItem>
                      <SelectItem value="pending">Mark as Pending</SelectItem>
                      <SelectItem value="actual">Mark as Actual</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete ${selectedTransactions.length} selected transactions?`)) {
                        selectedTransactions.forEach(id => deleteTransaction.mutate({ id }));
                        setSelectedTransactions([]);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTransactions([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {searchQuery ? "No transactions match your search" : "No transactions yet"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    Add Your First Transaction
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(transaction.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTransactions([...selectedTransactions, transaction.id]);
                          } else {
                            setSelectedTransactions(selectedTransactions.filter(id => id !== transaction.id));
                          }
                        }}
                        className="rounded border-gray-300 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{transaction.description || 'Transaction'}</p>
                          {transaction.isProjected && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                              Projected
                            </span>
                          )}
                          {transaction.isPending && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                              Pending
                            </span>
                          )}
                          {transaction.isRecurring && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                              Recurring
                            </span>
                          )}
                          {transaction.attachments && transaction.attachments !== 'null' && JSON.parse(transaction.attachments).length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const attachments = JSON.parse(transaction.attachments || '[]');
                                if (attachments[0]?.url) {
                                  window.open(attachments[0].url, '_blank');
                                }
                              }}
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                              title="View attachments"
                            >
                              <Paperclip className="w-3 h-3" />
                              {JSON.parse(transaction.attachments).length}
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`text-lg font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(parseFloat(transaction.amount)))}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingTransaction(transaction);
                            setFormData({
                              type: transaction.type,
                              amount: transaction.amount,
                              categoryId: transaction.categoryId.toString(),
                              accountId: transaction.accountId.toString(),
                              description: transaction.description || '',
                              date: new Date(transaction.date).toISOString().split('T')[0],
                              notes: transaction.notes || '',
                              isPending: transaction.isPending || false,
                              isProjected: transaction.isProjected || false,
                              isRecurring: transaction.isRecurring || false,
                              recurringFrequency: transaction.recurringFrequency || '',
                              attachments: transaction.attachments ? JSON.parse(transaction.attachments) : []
                            });
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this transaction?')) {
                              deleteTransaction.mutate({ id: transaction.id });
                            }
                          }}
                          disabled={deleteTransaction.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
