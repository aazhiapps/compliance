import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, User, Mail, Phone, Shield, CheckCircle, AlertCircle } from "lucide-react";

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userStatus: "active" | "inactive" | "suspended";
  onSave: (userId: string, updates: any) => void;
  onSuspend: (userId: string) => void;
  onApprove: (userId: string) => void;
}

export default function UserEditModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  userPhone,
  userStatus,
  onSave,
  onSuspend,
  onApprove,
}: UserEditModalProps) {
  const [formData, setFormData] = useState({
    name: userName,
    email: userEmail,
    phone: userPhone,
    status: userStatus,
    notes: "",
  });

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(userId, formData);
    onClose();
  };

  const handleSuspend = () => {
    if (window.confirm("Are you sure you want to suspend this user?")) {
      onSuspend(userId);
      onClose();
    }
  };

  const handleApprove = () => {
    onApprove(userId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Edit User</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Status Badge */}
          <div>
            <span
              className={`px-4 py-2 rounded-full font-semibold flex items-center gap-2 w-fit ${
                userStatus === "active"
                  ? "bg-success/10 text-success"
                  : userStatus === "suspended"
                    ? "bg-red-50 text-red-700"
                    : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {userStatus === "active" && <CheckCircle className="w-5 h-5" />}
              {userStatus === "suspended" && <AlertCircle className="w-5 h-5" />}
              {userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}
            </span>
          </div>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Admin Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any notes about this user..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
            {userStatus !== "active" && (
              <Button
                onClick={handleApprove}
                className="flex-1 bg-success hover:bg-success/90 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve User
              </Button>
            )}
            {userStatus !== "suspended" && (
              <Button
                onClick={handleSuspend}
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                Suspend User
              </Button>
            )}
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
