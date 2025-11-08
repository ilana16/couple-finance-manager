import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  PiggyBank,
  Target,
  Calendar,
  TrendingUp,
  Loader2,
  Edit2,
  Trash2
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

export default function Goals() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "0",
    targetDate: "",
    ownership: "joint" as "joint" | "individual",
    priority: "medium" as "low" | "medium" | "high",
  });

  const { data: goals, isLoading, refetch } = trpc.goals.list.useQuery();
  
  const updateMutation = trpc.goals.update.useMutation({
    onSuccess: () => {
      toast.success("Goal updated successfully");
      setIsEditDialogOpen(false);
      setEditingGoal(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update goal");
    },
  });

  const deleteMutation = trpc.goals.delete.useMutation({
    onSuccess: () => {
      toast.success("Goal deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete goal");
    },
  });

  const createMutation = trpc.goals.create.useMutation({
    onSuccess: () => {
      toast.success("Goal created successfully");
      setIsAddDialogOpen(false);
      refetch();
      setFormData({
        name: "",
        targetAmount: "",
        currentAmount: "0",
        targetDate: "",
        ownership: "joint",
        priority: "medium",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create goal");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      targetAmount: formData.targetAmount,
      currentAmount: formData.currentAmount,
      targetDate: formData.targetDate ? new Date(formData.targetDate) : undefined,
      ownership: formData.ownership,
      priority: formData.priority,
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

  const totalTarget = goals?.reduce((sum, goal) => sum + parseFloat(goal.targetAmount), 0) || 0;
  const totalCurrent = goals?.reduce((sum, goal) => sum + parseFloat(goal.currentAmount), 0) || 0;
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Savings Goals</h1>
            <p className="text-gray-500 mt-1">Track your progress toward financial goals</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>

        {/* Overall Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalTarget)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalCurrent)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {overallProgress.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {!goals || goals.length === 0 ? (
            <Card className="p-12 text-center">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Goals Yet</h3>
              <p className="text-gray-500 mb-6">Start tracking your savings goals</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Button>
            </Card>
          ) : (
            goals.map((goal) => {
              const target = parseFloat(goal.targetAmount);
              const current = parseFloat(goal.currentAmount);
              const progress = target > 0 ? (current / target) * 100 : 0;
              const remaining = target - current;
              const daysRemaining = goal.targetDate 
                ? Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null;

              const priorityColors = {
                high: "bg-red-100 text-red-700",
                medium: "bg-yellow-100 text-yellow-700",
                low: "bg-green-100 text-green-700",
              };

              return (
                <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{goal.name}</CardTitle>
                        <div className="flex gap-2">
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                            {goal.ownership === "joint" ? "Joint" : "Individual"}
                          </span>
                          {goal.priority && (
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[goal.priority]}`}>
                              {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)} Priority
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingGoal(goal);
                            setFormData({
                              name: goal.name,
                              targetAmount: goal.targetAmount.toString(),
                              currentAmount: goal.currentAmount.toString(),
                              targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
                              ownership: goal.ownership,
                              priority: goal.priority || 'medium',
                            });
                            setIsEditDialogOpen(true);
                          }}
                          className="hover:bg-gray-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this goal?')) {
                              deleteMutation.mutate({ id: goal.id });
                            }
                          }}
                          className="hover:bg-red-100 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                          <PiggyBank className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Target Amount</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(target)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Current Amount</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(current)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Remaining</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(remaining)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Target Date</p>
                        <p className="text-lg font-bold text-gray-900">
                          {goal.targetDate 
                            ? new Date(goal.targetDate).toLocaleDateString() 
                            : "No date set"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{formatCurrency(current)} saved</span>
                        <span>{formatCurrency(remaining)} to go</span>
                      </div>
                    </div>

                    {daysRemaining !== null && daysRemaining > 0 && (
                      <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {daysRemaining} days remaining
                          {remaining > 0 && daysRemaining > 0 && (
                            <span className="text-gray-600 ml-2">
                              (Save {formatCurrency(remaining / daysRemaining)}/day)
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {progress >= 100 && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-medium">Goal Achieved! 🎉</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Add Progress
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Edit Goal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Add Goal Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Goal</DialogTitle>
              <DialogDescription>
                Create a savings goal to track your progress
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Goal Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Emergency Fund"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetAmount">Target Amount</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    step="0.01"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="10000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="currentAmount">Current Amount</Label>
                  <Input
                    id="currentAmount"
                    type="number"
                    step="0.01"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownership">Ownership</Label>
                  <Select
                    value={formData.ownership}
                    onValueChange={(value: "joint" | "individual") =>
                      setFormData({ ...formData, ownership: value })
                    }
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

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: "low" | "medium" | "high") =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Goal"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Goal Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Goal</DialogTitle>
              <DialogDescription>
                Update your savings goal details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingGoal) {
                updateMutation.mutate({
                  id: editingGoal.id,
                  name: formData.name,
                  targetAmount: formData.targetAmount,
                  currentAmount: formData.currentAmount,
                  targetDate: formData.targetDate ? new Date(formData.targetDate) : undefined,
                  priority: formData.priority,
                });
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Goal Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Emergency Fund"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-targetAmount">Target Amount</Label>
                  <Input
                    id="edit-targetAmount"
                    type="number"
                    step="0.01"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="10000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-currentAmount">Current Amount</Label>
                  <Input
                    id="edit-currentAmount"
                    type="number"
                    step="0.01"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-targetDate">Target Date</Label>
                <Input
                  id="edit-targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-ownership">Ownership</Label>
                  <Select
                    value={formData.ownership}
                    onValueChange={(value: "joint" | "individual") =>
                      setFormData({ ...formData, ownership: value })
                    }
                  >
                    <SelectTrigger id="edit-ownership">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="joint">Joint</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: "low" | "medium" | "high") =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger id="edit-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  Update Goal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
