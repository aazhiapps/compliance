import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Plus, MoreVertical, Shield, UserCheck, UserX, Edit } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

interface User {
  id: string;
  name: string;
  email: string;
  businessType: string;
  joinedDate: string;
  status: "active" | "inactive" | "suspended";
  applications: number;
  verified: boolean;
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Mock user data
  const users: User[] = [
    {
      id: "user_1",
      name: "Demo User",
      email: "demo@example.com",
      businessType: "Individual",
      joinedDate: "2024-02-01",
      status: "active",
      applications: 2,
      verified: true,
    },
    {
      id: "user_2",
      name: "Rajesh Kumar",
      email: "rajesh@example.com",
      businessType: "Startup",
      joinedDate: "2024-02-02",
      status: "active",
      applications: 1,
      verified: true,
    },
    {
      id: "user_3",
      name: "Priya Singh",
      email: "priya@example.com",
      businessType: "Company",
      joinedDate: "2024-02-03",
      status: "active",
      applications: 0,
      verified: true,
    },
    {
      id: "user_4",
      name: "Amit Patel",
      email: "amit@example.com",
      businessType: "Individual",
      joinedDate: "2024-02-04",
      status: "inactive",
      applications: 0,
      verified: false,
    },
    {
      id: "user_5",
      name: "Neha Sharma",
      email: "neha@example.com",
      businessType: "Company",
      joinedDate: "2024-02-05",
      status: "active",
      applications: 3,
      verified: true,
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
        return "bg-success/10 text-success";
      case "inactive":
        return "bg-yellow-50 text-yellow-700";
      case "suspended":
        return "bg-red-50 text-red-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage and approve user accounts</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 flex-col md:flex-row">
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
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Users ({filteredUsers.length})</CardTitle>
                <CardDescription>
                  {selectedUsers.size > 0 && `${selectedUsers.size} selected`}
                </CardDescription>
              </div>
              {selectedUsers.size > 0 && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Approve Selected
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    Suspend Selected
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
                          } else {
                            setSelectedUsers(new Set());
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Business</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Joined</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Apps</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-gray-50 transition-colors">
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
                          <p className="font-medium text-foreground">{user.name}</p>
                          {user.verified && (
                            <p className="text-xs text-success flex items-center gap-1 mt-1">
                              <UserCheck className="w-3 h-3" /> Verified
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{user.email}</td>
                      <td className="py-3 px-4 text-sm capitalize">{user.businessType}</td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(user.joinedDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">{user.applications}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                            user.status
                          )}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
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

        {/* Stats Footer */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Users</p>
              <p className="text-3xl font-bold">{users.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Active</p>
              <p className="text-3xl font-bold text-success">{users.filter((u) => u.status === "active").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Verified</p>
              <p className="text-3xl font-bold text-primary">{users.filter((u) => u.verified).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{users.filter((u) => !u.verified).length}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
