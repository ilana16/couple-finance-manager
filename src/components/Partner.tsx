import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, UserPlus, UserMinus, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function Partner() {
  const { user } = useAuth();
  const [partnerEmail, setPartnerEmail] = useState("");
  const [showJointView, setShowJointView] = useState(true);

  const handleInvitePartner = () => {
    if (!partnerEmail) {
      toast.error("Please enter your partner's email");
      return;
    }
    // This will be implemented with the API
    toast.success(`Invitation sent to ${partnerEmail}`);
    setPartnerEmail("");
  };

  const handleRemovePartner = () => {
    // This will be implemented with the API
    toast.success("Partner removed successfully");
  };

  const hasPartner = user?.partnerId; // Check if user has a partner linked

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Partner Management</h1>
          <p className="text-gray-500 mt-1">Manage your financial partner and sharing preferences</p>
        </div>

        {/* View Toggle */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <CardTitle>View Preferences</CardTitle>
            </div>
            <CardDescription>Choose how you want to view your finances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Show Joint View</p>
                <p className="text-sm text-gray-500">
                  Display combined finances from both you and your partner
                </p>
              </div>
              <Switch
                checked={showJointView}
                onCheckedChange={setShowJointView}
                disabled={!hasPartner}
              />
            </div>

            {!hasPartner && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  You need to link a partner before you can use joint view features
                </p>
              </div>
            )}

            {showJointView && hasPartner && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Joint View Active:</strong> You're viewing combined finances from both partners
                </p>
              </div>
            )}

            {!showJointView && hasPartner && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Individual View Active:</strong> You're viewing only your personal finances
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Partner Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <CardTitle>Partner Status</CardTitle>
            </div>
            <CardDescription>Your current partner connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasPartner ? (
              <>
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Partner Connected</p>
                    <p className="text-sm text-gray-600">
                      You're sharing finances with your partner
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-700 font-medium">Active</span>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  onClick={handleRemovePartner}
                  className="w-full"
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Remove Partner
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No partner connected</p>
                <p className="text-sm text-gray-500">
                  Invite your partner to start sharing financial information
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invite Partner */}
        {!hasPartner && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-600" />
                <CardTitle>Invite Partner</CardTitle>
              </div>
              <CardDescription>Send an invitation to your financial partner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="partner-email">Partner's Email Address</Label>
                <Input
                  id="partner-email"
                  type="email"
                  placeholder="partner@example.com"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                />
              </div>

              <Button onClick={handleInvitePartner} className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">How it works</p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>Your partner will receive an email invitation</li>
                  <li>They need to sign up or log in to accept</li>
                  <li>Once accepted, you can view joint finances together</li>
                  <li>Each partner maintains individual account control</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sharing Permissions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-orange-600" />
              <CardTitle>Sharing Permissions</CardTitle>
            </div>
            <CardDescription>Control what your partner can see</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Share All Transactions</p>
                <p className="text-sm text-gray-500">Allow partner to view all your transactions</p>
              </div>
              <Switch defaultChecked disabled={!hasPartner} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Share Budget Information</p>
                <p className="text-sm text-gray-500">Allow partner to view your budgets and goals</p>
              </div>
              <Switch defaultChecked disabled={!hasPartner} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Share Debt Information</p>
                <p className="text-sm text-gray-500">Allow partner to view your debts and payoff plans</p>
              </div>
              <Switch defaultChecked disabled={!hasPartner} />
            </div>

            {!hasPartner && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Connect a partner to configure sharing permissions
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
