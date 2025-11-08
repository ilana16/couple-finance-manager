import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Tag, Edit, Trash2, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#10B981", // Green
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#6366F1", // Indigo
  "#14B8A6", // Teal
];

const PRESET_ICONS = [
  "shopping-cart", "home", "car", "utensils", "plane", "heart",
  "briefcase", "gift", "film", "music", "book", "coffee",
  "smartphone", "laptop", "credit-card", "dollar-sign"
];

export default function Categories() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    color: "#3B82F6",
    icon: "tag",
  });

  const { data: categories, isLoading, refetch } = trpc.categories.list.useQuery();
  
  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success("Category created successfully");
      setIsAddDialogOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create category");
    },
  });

  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success("Category updated successfully");
      setEditingCategory(null);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update category");
    },
  });

  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("Category deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete category");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "expense",
      color: "#3B82F6",
      icon: "tag",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color || "#3B82F6",
      icon: category.icon || "tag",
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingCategory(null);
    resetForm();
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

  const customCategories = categories?.filter(c => !c.isDefault) || [];
  const defaultCategories = categories?.filter(c => c.isDefault) || [];
  const incomeCategories = customCategories.filter(c => c.type === "income");
  const expenseCategories = customCategories.filter(c => c.type === "expense");

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-500 mt-1">Manage your income and expense categories</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900 font-medium">About Categories</p>
                <p className="text-sm text-blue-700 mt-1">
                  Create custom categories to organize your transactions. Default categories cannot be edited or deleted.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Income Categories */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Income Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incomeCategories.length === 0 ? (
              <Card className="col-span-full p-8 text-center">
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No custom income categories yet</p>
              </Card>
            ) : (
              incomeCategories.map((category) => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: (category.color || "#3B82F6") + "20" }}
                        >
                          <Tag className="w-5 h-5" style={{ color: category.color || "#3B82F6" }} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{category.name}</p>
                          <p className="text-xs text-gray-500">Custom</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Custom Expense Categories */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Expense Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenseCategories.length === 0 ? (
              <Card className="col-span-full p-8 text-center">
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No custom expense categories yet</p>
              </Card>
            ) : (
              expenseCategories.map((category) => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: (category.color || "#3B82F6") + "20" }}
                        >
                          <Tag className="w-5 h-5" style={{ color: category.color || "#3B82F6" }} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{category.name}</p>
                          <p className="text-xs text-gray-500">Custom</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Default Categories */}
        {defaultCategories.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Default Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {defaultCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: (category.color || "#3B82F6") + "20" }}
                  >
                    <Tag className="w-4 h-4" style={{ color: category.color || "#3B82F6" }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {category.type === "income" ? "Income" : "Expense"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Update the category details below"
                  : "Create a custom category for your transactions"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Groceries, Salary"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "income" | "expense") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-8 gap-2 mt-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color
                          ? "border-gray-900 scale-110"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDialogClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingCategory ? (
                    "Update Category"
                  ) : (
                    "Create Category"
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
