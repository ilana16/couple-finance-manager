import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Upload, Download, FileText } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [budgetThreshold, setBudgetThreshold] = useState("80");
  const [goalMilestones, setGoalMilestones] = useState(true);
  const [billReminders, setBillReminders] = useState(true);
  const [billReminderDays, setBillReminderDays] = useState("3");
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [anomalyAlerts, setAnomalyAlerts] = useState(true);

  const handleSaveProfile = () => {
    toast.success("Profile settings saved");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved");
  };

  const utils = trpc.useUtils();
  
  const exportCSV = trpc.transactions.exportCSV.useQuery(undefined, {
    enabled: false,
  });
  
  const importCSV = trpc.transactions.importCSV.useMutation({
    onSuccess: (result) => {
      toast.success(`Successfully imported ${result.imported} transactions${result.failed > 0 ? `, ${result.failed} failed` : ''}`);
      utils.transactions.list.invalidate();
      utils.dashboard.summary.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to import CSV: " + error.message);
    }
  });

  const handleExportTransactions = async () => {
    try {
      const result = await exportCSV.refetch();
      if (result.data?.csv) {
        // Create a download link
        const blob = new Blob([result.data.csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Transactions exported successfully!");
      }
    } catch (error) {
      toast.error("Failed to export transactions");
    }
  };

  const handleImportTransactions = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvData = e.target?.result as string;
        importCSV.mutate({ csvData });
      };
      reader.readAsText(file);
      // Reset input
      event.target.value = '';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account and preferences</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <CardTitle>Profile Settings</CardTitle>
            </div>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                defaultValue={user?.name || ""}
                placeholder="Your full name"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                defaultValue={user?.email || ""}
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <Label htmlFor="currency">Preferred Currency</Label>
              <Select defaultValue="ILS">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ILS">Israeli Shekel (₪)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="GBP">British Pound (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSaveProfile}>Save Profile</Button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" />
              <CardTitle>Notification Preferences</CardTitle>
            </div>
            <CardDescription>Choose what updates you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive email updates about your finances</p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Budget Alerts</p>
                <p className="text-sm text-gray-500">Get notified when you approach budget limits</p>
              </div>
              <Switch
                checked={budgetAlerts}
                onCheckedChange={setBudgetAlerts}
              />
            </div>

            {budgetAlerts && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="budget-threshold">Alert Threshold</Label>
                <Select value={budgetThreshold} onValueChange={setBudgetThreshold}>
                  <SelectTrigger id="budget-threshold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50% of budget</SelectItem>
                    <SelectItem value="75">75% of budget</SelectItem>
                    <SelectItem value="80">80% of budget</SelectItem>
                    <SelectItem value="90">90% of budget</SelectItem>
                    <SelectItem value="100">100% of budget</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Bill Reminders</p>
                <p className="text-sm text-gray-500">Get reminded before bills are due</p>
              </div>
              <Switch
                checked={billReminders}
                onCheckedChange={setBillReminders}
              />
            </div>

            {billReminders && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="reminder-days">Remind me</Label>
                <Select value={billReminderDays} onValueChange={setBillReminderDays}>
                  <SelectTrigger id="reminder-days">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day before</SelectItem>
                    <SelectItem value="2">2 days before</SelectItem>
                    <SelectItem value="3">3 days before</SelectItem>
                    <SelectItem value="5">5 days before</SelectItem>
                    <SelectItem value="7">7 days before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Goal Milestones</p>
                <p className="text-sm text-gray-500">Celebrate when you reach savings milestones</p>
              </div>
              <Switch
                checked={goalMilestones}
                onCheckedChange={setGoalMilestones}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Weekly Summary</p>
                <p className="text-sm text-gray-500">Receive weekly financial summary emails</p>
              </div>
              <Switch
                checked={weeklySummary}
                onCheckedChange={setWeeklySummary}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Anomaly Alerts</p>
                <p className="text-sm text-gray-500">Get notified about unusual spending patterns</p>
              </div>
              <Switch
                checked={anomalyAlerts}
                onCheckedChange={setAnomalyAlerts}
              />
            </div>

            <Button onClick={handleSaveNotifications}>Save Preferences</Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-green-600" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize how the app looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select defaultValue="light">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark (Coming Soon)</SelectItem>
                  <SelectItem value="auto">Auto (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Select defaultValue="en">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="he">עברית (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Import/Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <CardTitle>Data Import/Export</CardTitle>
            </div>
            <CardDescription>Import or export your financial data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Import Transactions</p>
                <p className="text-sm text-gray-500">Upload a CSV file to bulk import transactions</p>
              </div>
              <label htmlFor="csv-import">
                <Button variant="outline" className="gap-2" disabled={importCSV.isPending} asChild>
                  <span>
                    {importCSV.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Import CSV
                      </>
                    )}
                  </span>
                </Button>
                <input
                  id="csv-import"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportTransactions}
                />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Export Transactions</p>
                <p className="text-sm text-gray-500">Download all your transactions as CSV</p>
              </div>
              <Button variant="outline" className="gap-2" onClick={handleExportTransactions}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">CSV Format Guide</p>
              <p className="text-xs text-blue-700">
                Your CSV should include columns: Date, Description, Amount, Type (income/expense), Category, Account
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              <CardTitle>Privacy & Security</CardTitle>
            </div>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-gray-900 mb-2">Data Privacy</p>
              <p className="text-sm text-gray-600 mb-4">
                Your financial data is encrypted and secure. We never share your information with third parties.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
              <Button variant="outline" disabled>
                Enable (Coming Soon)
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Export Data</p>
                <p className="text-sm text-gray-500">Download all your financial data</p>
              </div>
              <Button variant="outline" disabled>
                Export (Coming Soon)
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Delete Account</p>
                <p className="text-sm text-gray-500">Permanently delete your account and data</p>
              </div>
              <Button variant="destructive" disabled>
                Delete (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
