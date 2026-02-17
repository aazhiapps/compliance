import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export interface UserForEdit {
  id: string;
  name: string;
  email: string;
  businessType: string;
  joinedDate: string;
  status: "active" | "inactive" | "suspended";
  applications: number;
  verified: boolean;
}

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserForEdit;
  onSave: (updatedUser: UserForEdit) => void;
  onSuspend: (userId: string) => void;
  onApprove: (userId: string) => void;
}

export default function UserEditModal({
  isOpen,
  onClose,
  user,
  onSave,
  onSuspend,
  onApprove,
}: UserEditModalProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: "",
    status: user.status,
    notes: "",
  });

  if (!isOpen) return null;

  const handleSave = () => {
    const updatedUser: UserForEdit = {
      ...user,
      name: formData.name,
      email: formData.email,
      status: formData.status,
    };
    onSave(updatedUser);
  };

  const handleSuspend = () => {
    if (window.confirm("Are you sure you want to suspend this user?")) {
      onSuspend(user.id);
      onClose();
    }
  };

  const handleApprove = () => {
    onApprove(user.id);
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
                user.status === "active"
                  ? "bg-success/10 text-success"
                  : user.status === "suspended"
                    ? "bg-red-50 text-red-700"
                    : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {user.status === "active" && <CheckCircle className="w-5 h-5" />}
              {user.status === "suspended" && (
                <AlertCircle className="w-5 h-5" />
              )}
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </span>
          </div>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
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
                <label className="block text-sm font-medium mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add any notes about this user..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={handleSave}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Save Changes
            </Button>
            {user.status !== "active" && (
              <Button
                onClick={handleApprove}
                className="flex-1 bg-success hover:bg-success/90 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve User
              </Button>
            )}
            {user.status !== "suspended" && (
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
