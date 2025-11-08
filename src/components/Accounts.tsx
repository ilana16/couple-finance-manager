import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Wallet,
  CreditCard,
  PiggyBank,
  Building,
  Edit,
  Trash2,
  Loader2
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
import { formatCurrency } from "@/lib/currency";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const accountTypeIcons = {
  checking: Wallet,
  savings: PiggyBank,
  credit: CreditCard,
  investment: Building,
};

export default function Accounts() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "checking" as "checking" | "savings" | "credit" | "investment",
    balance: "",
    currency: "ILS",
    creditLimit: "",
    ownership: "joint" as "joint" | "individual",
  });

  const utils = trpc.useUtils();
  
  const { data: accounts = [], isLoading } = trpc.accounts.list.useQuery();

  const createAccount = trpc.accounts.create.useMutation({
    onSuccess: () => {
      utils.accounts.list.invalidate();
      utils.dashboard.summary.invalidate();
      setIsAddDialogOpen(false);
      resetForm();
      toast.success("Account created successfully!");
    },
    onError: () => {
      toast.error("Failed to create account");
    }
  });

  const updateAccount = trpc.accounts.update.useMutation({
    onSuccess: () => {
      utils.accounts.list.invalidate();
      utils.dashboard.summary.invalidate();
      setIsEditDialogOpen(false);
      setEditingAccount(null);
      resetForm();
      toast.success("Account updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update account");
    }
  });

  const deleteAccount = trpc.accounts.delete.useMutation({
    onSuccess: () => {
      utils.accounts.list.invalidate();
      utils.dashboard.summary.invalidate();
      toast.success("Account deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete account");
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "checking",
      balance: "",
      currency: "ILS",
      creditLimit: "",
      ownership: "joint",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.balance) {
      toast.error("Please fill in all required fields");
      return;
    }

    createAccount.mutate({
      name: formData.name,
      type: formData.type,
      balance: formData.balance,
      currency: formData.currency,
      ownership: formData.ownership,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingAccount || !formData.name || !formData.balance) {
      toast.error("Please fill in all required fields");
      return;
    }

    updateAccount.mutate({
      id: editingAccount.id,
      name: formData.name,
      type: formData.type,
      balance: formData.balance,
      ownership: formData.ownership,
    });
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency || "ILS",
      creditLimit: account.creditLimit || "",
      ownership: account.ownership || "joint",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete account "${name}"?`)) {
      deleteAccount.mutate({ id });
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => {
    const balance = parseFloat(acc.balance);
    return acc.type === 'credit' ? sum - balance : sum + balance;
  }, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
            <p className="text-gray-500 mt-1">Manage your financial accounts</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>

        {/* Total Balance Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-blue-700 font-medium mb-2">Total Net Worth</p>
              <p className={`text-4xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalBalance)}
              </p>
              <p className="text-xs text-blue-600 mt-2">Across {accounts.length} accounts</p>
            </div>
          </CardContent>
        </Card>

        {/* Accounts List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No accounts yet</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                Add Your First Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((account) => {
              const Icon = accountTypeIcons[account.type as keyof typeof accountTypeIcons] || Wallet;
              const balance = parseFloat(account.balance);
              
              return (
                <Card key={account.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          account.type === 'credit' ? 'bg-orange-100' :
                          account.type === 'savings' ? 'bg-green-100' :
                          account.type === 'investment' ? 'bg-purple-100' :
                          'bg-blue-100'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            account.type === 'credit' ? 'text-orange-600' :
                            account.type === 'savings' ? 'text-green-600' :
                            account.type === 'investment' ? 'text-purple-600' :
                            'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{account.name}</CardTitle>
                          <CardDescription className="capitalize">{account.type} • {account.ownership}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(account)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(account.id, account.name)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Balance</span>
                        <span className={`text-xl font-bold ${
                          account.type === 'credit' ? 'text-orange-600' :
                          balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(balance)}
                        </span>
                      </div>
                      {account.type === 'credit' && account.creditLimit && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Credit Limit</span>
                          <span className="font-medium">{formatCurrency(parseFloat(account.creditLimit))}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Account Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
              <DialogDescription>
                Create a new financial account to track
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Account Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Main Checking"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Account Type *</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="balance">Current Balance *</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.balance}
                  onChange={(e) => setFormData({...formData, balance: e.target.value})}
                  required
                />
              </div>

              {formData.type === 'credit' && (
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="ownership">Ownership *</Label>
                <Select value={formData.ownership} onValueChange={(value: any) => setFormData({...formData, ownership: value})}>
                  <SelectTrigger id="ownership">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="joint">Joint</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={createAccount.isPending}>
                  {createAccount.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Account Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
              <DialogDescription>
                Update account details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Account Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., Main Checking"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-type">Account Type *</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                  <SelectTrigger id="edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-balance">Current Balance *</Label>
                <Input
                  id="edit-balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.balance}
                  onChange={(e) => setFormData({...formData, balance: e.target.value})}
                  required
                />
              </div>

              {formData.type === 'credit' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-creditLimit">Credit Limit</Label>
                  <Input
                    id="edit-creditLimit"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-ownership">Ownership *</Label>
                <Select value={formData.ownership} onValueChange={(value: any) => setFormData({...formData, ownership: value})}>
                  <SelectTrigger id="edit-ownership">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="joint">Joint</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={updateAccount.isPending}>
                  {updateAccount.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Account
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
