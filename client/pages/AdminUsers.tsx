import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Shield,
  UserCheck,
  Edit,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import UserEditModal from "@/components/UserEditModal";
import { CSVExportButton } from "@/components/CSVExportButton";
import { CSVImportButton } from "@/components/CSVImportButton";
import { User as ApiUser } from "@shared/auth";
import type { UserForEdit } from "@/components/UserEditModal";

// Extended User interface for display purposes
interface User extends ApiUser {
  name: string; // Combined firstName + lastName
  joinedDate: string; // createdAt formatted
  status: "active" | "inactive" | "suspended";
  applications: number;
  verified: boolean; // isEmailVerified
}

// Helper to convert User to UserForEdit
const toUserForEdit = (user: User): UserForEdit => ({
  id: user.id,
  name: user.name,
  email: user.email,
  businessType: user.businessType,
  joinedDate: user.joinedDate,
  status: user.status,
  applications: user.applications,
  verified: user.verified,
});

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<User[]>([
    {
      id: "user_1",
      name: "Demo User",
      firstName: "Demo",
      lastName: "User",
      email: "demo@example.com",
      phone: "+91-9876543210",
      role: "user",
      businessType: "individual",
      language: "en",
      createdAt: "2024-02-01T00:00:00Z",
      isEmailVerified: true,
      joinedDate: "2024-02-01",
      status: "active",
      applications: 2,
      verified: true,
    },
    {
      id: "user_2",
      name: "Rajesh Kumar",
      firstName: "Rajesh",
      lastName: "Kumar",
      email: "rajesh@example.com",
      phone: "+91-9876543211",
      role: "user",
      businessType: "startup",
      language: "en",
      createdAt: "2024-02-02T00:00:00Z",
      isEmailVerified: true,
      joinedDate: "2024-02-02",
      status: "active",
      applications: 1,
      verified: true,
    },
    {
      id: "user_3",
      name: "Priya Singh",
      firstName: "Priya",
      lastName: "Singh",
      email: "priya@example.com",
      phone: "+91-9876543212",
      role: "user",
      businessType: "company",
      language: "en",
      createdAt: "2024-02-03T00:00:00Z",
      isEmailVerified: true,
      joinedDate: "2024-02-03",
      status: "active",
      applications: 0,
      verified: true,
    },
    {
      id: "user_4",
      name: "Amit Patel",
      firstName: "Amit",
      lastName: "Patel",
      email: "amit@example.com",
      phone: "+91-9876543213",
      role: "user",
      businessType: "individual",
      language: "en",
      createdAt: "2024-02-04T00:00:00Z",
      isEmailVerified: false,
      joinedDate: "2024-02-04",
      status: "inactive",
      applications: 0,
      verified: false,
    },
    {
      id: "user_5",
      name: "Neha Sharma",
      firstName: "Neha",
      lastName: "Sharma",
      email: "neha@example.com",
      phone: "+91-9876543214",
      role: "user",
      businessType: "company",
      language: "en",
      createdAt: "2024-02-05T00:00:00Z",
      isEmailVerified: true,
      joinedDate: "2024-02-05",
      status: "active",
      applications: 3,
      verified: true,
    },
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSaveUser = (updatedUser: User) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
    );
    setModalOpen(false);
    setSelectedUserId(null);
  };

  const handleApproveUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, verified: true, status: "active" as const }
          : user,
      ),
    );
  };

  const handleSuspendUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, status: "suspended" as const } : user,
      ),
    );
  };

  const handleBulkApprove = () => {
    setUsers((prev) =>
      prev.map((user) =>
        selectedUsers.has(user.id)
          ? { ...user, verified: true, status: "active" as const }
          : user,
      ),
    );
    setSelectedUsers(new Set());
  };

  const handleBulkSuspend = () => {
    if (
      window.confirm(
        `Are you sure you want to suspend ${selectedUsers.size} user(s)?`,
      )
    ) {
      setUsers((prev) =>
        prev.map((user) =>
          selectedUsers.has(user.id)
            ? { ...user, status: "suspended" as const }
            : user,
        ),
      );
      setSelectedUsers(new Set());
    }
  };

  const toggleUserSelect = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border border-green-200";
      case "inactive":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "suspended":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const recentUsers = users
    .sort(
      (a, b) =>
        new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime(),
    )
    .slice(0, 3);
  const inactiveUsers = users.filter(
    (u) => u.status === "inactive" || !u.verified,
  );
  const verifiedUsers = users.filter((u) => u.verified).length;
  const activeUsers = users.filter((u) => u.status === "active").length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Customer Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and approve customer accounts
            </p>
          </div>
          <div className="flex gap-2">
            <CSVExportButton
              endpoint="/api/admin/csv/users/export"
              filename="users.csv"
              label="Export"
              variant="outline"
            />
            <CSVImportButton
              endpoint="/api/admin/csv/users/import"
              templateEndpoint="/api/admin/csv/template/users"
              entityType="Users"
              label="Import"
              variant="outline"
            />
            <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    Total Customers
                  </p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">
                    {users.length}
                  </p>
                </div>
                <Users className="w-10 h-10 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">
                    Active Customers
                  </p>
                  <p className="text-3xl font-bold text-green-900 mt-1">
                    {activeUsers}
                  </p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">
                    Verified
                  </p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">
                    {verifiedUsers}
                  </p>
                </div>
                <Shield className="w-10 h-10 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">
                    Pending Action
                  </p>
                  <p className="text-3xl font-bold text-orange-900 mt-1">
                    {inactiveUsers.length}
                  </p>
                </div>
                <AlertCircle className="w-10 h-10 text-orange-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Signups */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent Signups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.joinedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setModalOpen(true);
                    }}
                  >
                    Review
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Pending Approvals
              </CardTitle>
              <CardDescription>
                {inactiveUsers.length} customers need verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {inactiveUsers.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {user.name}
                    </p>
                    <p className="text-xs text-orange-600 capitalize">
                      {user.status} •{" "}
                      {!user.verified ? "Unverified" : "Verified"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setModalOpen(true);
                    }}
                  >
                    Approve
                  </Button>
                </div>
              ))}
              {inactiveUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All users verified!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Customer Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium">Active</p>
                  <span className="text-sm font-semibold text-green-600">
                    {activeUsers}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(activeUsers / users.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium">Verified</p>
                  <span className="text-sm font-semibold text-purple-600">
                    {verifiedUsers}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{
                      width: `${(verifiedUsers / users.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium">Pending</p>
                  <span className="text-sm font-semibold text-orange-600">
                    {inactiveUsers.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{
                      width: `${(inactiveUsers.length / users.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-3 flex-col md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">All Customers</CardTitle>
                <CardDescription>
                  {selectedUsers.size > 0
                    ? `${selectedUsers.size} selected`
                    : `${filteredUsers.length} total customers`}
                </CardDescription>
              </div>
              {selectedUsers.size > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-success hover:bg-success/90 text-white"
                    onClick={handleBulkApprove}
                  >
                    Approve ({selectedUsers.size})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleBulkSuspend}
                  >
                    Suspend ({selectedUsers.size})
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-200 bg-blue-50">
                    <th className="text-left py-4 px-4">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(
                              new Set(filteredUsers.map((u) => u.id)),
                            );
                          } else {
                            setSelectedUsers(new Set());
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Name
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Email
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Business
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Joined
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Apps
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Status
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelect(user.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-foreground">
                            {user.name}
                          </p>
                          {user.verified && (
                            <p className="text-xs text-success flex items-center gap-1 mt-1">
                              <UserCheck className="w-3 h-3" /> Verified
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="py-3 px-4 text-sm capitalize">
                        {user.businessType}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(user.joinedDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {user.applications}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                            user.status,
                          )}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No users found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Footer - Hidden since we have featured sections */}
      </div>

      {/* User Edit Modal */}
      {selectedUserId && users.find((u) => u.id === selectedUserId) && (
        <UserEditModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedUserId(null);
          }}
          user={toUserForEdit(users.find((u) => u.id === selectedUserId)!)}
          onSave={(updatedUser) => {
            // Merge the updated fields back into the full User object
            handleSaveUser({
              ...users.find((u) => u.id === selectedUserId)!,
              name: updatedUser.name,
              email: updatedUser.email,
              status: updatedUser.status,
            });
          }}
          onApprove={handleApproveUser}
          onSuspend={handleSuspendUser}
        />
      )}
    </AdminLayout>
  );
}
