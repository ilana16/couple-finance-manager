import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Plus, Loader2, PieChart, DollarSign } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

export default function Investments() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "stocks",
    symbol: "",
    currentPrice: "",
    purchasePrice: "",
    quantity: "",
    ownership: "joint" as "joint" | "individual",
  });

  const { data: investments, isLoading, refetch } = trpc.investments.list.useQuery();
  // const { data: performance, isLoading: perfLoading } = trpc.investments.performance.useQuery();
  const performance: any = [];
  const createMutation = trpc.investments.create.useMutation({
    onSuccess: () => {
      toast.success("Investment added successfully");
      setOpen(false);
      refetch();
      setFormData({
        name: "",
        type: "stocks",
        symbol: "",
        currentPrice: "",
        purchasePrice: "",
        quantity: "",
        ownership: "joint",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add investment");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      type: formData.type as any,
      symbol: formData.symbol || undefined,
      currentPrice: formData.currentPrice,
      purchasePrice: formData.purchasePrice,
      quantity: formData.quantity,
      ownership: formData.ownership,
    });
  };

  // Currency formatting is now imported from @/lib/currency

  const calculateGainLoss = (currentPrice: string | null, purchasePrice: string | null, quantity: string | null) => {
    if (!currentPrice || !purchasePrice || !quantity) {
      return { diff: 0, percentage: "0.00", currentValue: 0, purchaseValue: 0 };
    }
    const currentVal = parseFloat(currentPrice) * parseFloat(quantity);
    const purchaseVal = parseFloat(purchasePrice) * parseFloat(quantity);
    const diff = currentVal - purchaseVal;
    const percentage = purchaseVal > 0 ? ((diff / purchaseVal) * 100).toFixed(2) : "0.00";
    return { diff, percentage, currentValue: currentVal, purchaseValue: purchaseVal };
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

  const totalValue = investments?.reduce((sum, inv) => {
    const price = inv.currentPrice ? parseFloat(inv.currentPrice) : 0;
    const qty = inv.quantity ? parseFloat(inv.quantity) : 0;
    return sum + (price * qty);
  }, 0) || 0;
  
  const totalCost = investments?.reduce((sum, inv) => {
    const price = inv.purchasePrice ? parseFloat(inv.purchasePrice) : 0;
    const qty = inv.quantity ? parseFloat(inv.quantity) : 0;
    return sum + (price * qty);
  }, 0) || 0;
  const totalGain = totalValue - totalCost;
  const totalGainPercentage = totalCost > 0 ? ((totalGain / totalCost) * 100).toFixed(2) : "0.00";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Investments</h1>
            <p className="text-gray-500 mt-1">Track your investment portfolio</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Investment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Investment</DialogTitle>
                <DialogDescription>
                  Add a new investment to your portfolio
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Investment Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Apple Stock, S&P 500 ETF"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stocks">Stocks</SelectItem>
                      <SelectItem value="bonds">Bonds</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                      <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="real_estate">Real Estate</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="symbol">Symbol (Optional)</Label>
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="e.g., AAPL, BTC"
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity/Shares</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.0001"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="purchasePrice">Purchase Price (Per Unit)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="currentPrice">Current Price (Per Unit)</Label>
                  <Input
                    id="currentPrice"
                    type="number"
                    step="0.01"
                    value={formData.currentPrice}
                    onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ownership">Ownership</Label>
                  <Select
                    value={formData.ownership}
                    onValueChange={(value: "joint" | "individual") => setFormData({ ...formData, ownership: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="joint">Joint</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                    {createMutation.isPending ? "Adding..." : "Add Investment"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Live Performance Summary */}
        {performance && performance.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(performance.reduce((sum: number, p: any) => sum + p.currentValue, 0))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Gain/Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: performance.reduce((sum: number, p: any) => sum + p.gainLoss, 0) >= 0 ? '#10b981' : '#ef4444' }}>
                  {formatCurrency(performance.reduce((sum: number, p: any) => sum + p.gainLoss, 0))}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {(performance.reduce((sum: number, p: any) => sum + p.gainLoss, 0) / performance.reduce((sum: number, p: any) => sum + p.costBasis, 0) * 100).toFixed(2)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performance.length}</div>
                <p className="text-sm text-gray-600 mt-1">Active investments</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Portfolio Summary */}        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalValue)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Current portfolio value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalCost)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Original investment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Gain/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
              </div>
              <p className={`text-xs mt-1 ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalGain >= 0 ? '+' : ''}{totalGainPercentage}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Investments List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Portfolio</CardTitle>
            <CardDescription>All your investments in one place</CardDescription>
          </CardHeader>
          <CardContent>
            {!investments || investments.length === 0 ? (
              <div className="text-center py-12">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No investments yet</p>
                <Button onClick={() => setOpen(true)}>
                  Add Your First Investment
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {investments.map((investment) => {
                  const { diff, percentage, currentValue, purchaseValue } = calculateGainLoss(
                    investment.currentPrice,
                    investment.purchasePrice,
                    investment.quantity
                  );
                  return (
                    <div
                      key={investment.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{investment.name}</p>
                          <p className="text-sm text-gray-500 capitalize">{investment.type.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-400">{investment.quantity || 0} shares @ {formatCurrency(parseFloat(investment.currentPrice || "0"))}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(currentValue)}
                        </p>
                        <p className={`text-sm font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({diff >= 0 ? '+' : ''}{percentage}%)
                        </p>
                        <p className="text-xs text-gray-500">
                          Cost: {formatCurrency(purchaseValue)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
