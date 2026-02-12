import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Bell, Lock, CheckCircle, Zap } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

export default function AdminSettings() {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    systemName: "ComplianCe",
    adminEmail: "admin@compliance.app",
    supportEmail: "support@compliance.app",
    businessPhone: "+91 98765 50000",
    maintenanceMode: false,
    autoApproveEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: true,
    twoFactorEnabled: true,
    sessionTimeout: "30",
    maxLoginAttempts: "5",
    passwordExpiryDays: "90",
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
  }, []);

  const handleInputChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Store in localStorage for persistence (in a real app, save to backend)
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage system configuration and preferences</p>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <Card className="border-success/50 bg-success/5">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <p className="text-success font-medium">Settings saved successfully</p>
            </CardContent>
          </Card>
        )}

        {/* General Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              General Settings
            </CardTitle>
            <CardDescription>Basic system configuration and application details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">System Name</label>
                <input
                  type="text"
                  value={settings.systemName}
                  onChange={(e) => handleInputChange("systemName", e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Business Phone</label>
                <input
                  type="tel"
                  value={settings.businessPhone}
                  onChange={(e) => handleInputChange("businessPhone", e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Admin Email</label>
                <input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleInputChange("supportEmail", e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Temporarily disable user access for maintenance
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleInputChange("maintenanceMode", e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto Approve Enabled</p>
                  <p className="text-xs text-muted-foreground">
                    Automatically approve applications matching criteria
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoApproveEnabled}
                  onChange={(e) => handleInputChange("autoApproveEnabled", e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-green-600" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure how notifications are sent to users and admins</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleInputChange("emailNotifications", e.target.checked)}
                className="w-5 h-5 rounded"
              />
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive updates via SMS</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.smsNotifications}
                  onChange={(e) => handleInputChange("smsNotifications", e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">WhatsApp Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive updates via WhatsApp</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.whatsappNotifications}
                  onChange={(e) => handleInputChange("whatsappNotifications", e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-600" />
              Security Settings
            </CardTitle>
            <CardDescription>Configure security policies and access controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">
                  Require 2FA for all admin accounts
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.twoFactorEnabled}
                onChange={(e) => handleInputChange("twoFactorEnabled", e.target.checked)}
                className="w-5 h-5 rounded"
              />
            </div>

            <div className="border-t border-border pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleInputChange("sessionTimeout", e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Login Attempts</label>
                  <input
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => handleInputChange("maxLoginAttempts", e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password Expiry (days)</label>
                  <input
                    type="number"
                    value={settings.passwordExpiryDays}
                    onChange={(e) => handleInputChange("passwordExpiryDays", e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline">Reset to Defaults</Button>
          <Button 
            className="bg-primary hover:bg-primary/90" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
