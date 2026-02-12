import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Plus, AlertCircle, CheckCircle2, Clock, TrendingUp, Eye, Edit, MoreVertical } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

interface ComplianceItem {
  id: string;
  name: string;
  description: string;
  status: "compliant" | "pending" | "at_risk" | "non_compliant";
  deadline: string;
  priority: "high" | "medium" | "low";
  category: string;
  applicationsAffected: number;
  lastUpdated: string;
}

export default function AdminCompliance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | string>("all");
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([
    {
      id: "comp_1",
      name: "GDPR Compliance",
      description: "General Data Protection Regulation - Personal data protection",
      status: "compliant",
      deadline: "2024-12-31",
      priority: "high",
      category: "Data Privacy",
      applicationsAffected: 120,
      lastUpdated: "2024-02-10",
    },
    {
      id: "comp_2",
      name: "GST Documentation",
      description: "Maintain GST compliance documents for 5 years",
      status: "compliant",
      deadline: "2024-12-31",
      priority: "high",
      category: "Tax",
      applicationsAffected: 65,
      lastUpdated: "2024-02-09",
    },
    {
      id: "comp_3",
      name: "KYC Verification",
      description: "Know Your Customer verification for all users",
      status: "pending",
      deadline: "2024-03-15",
      priority: "high",
      category: "Verification",
      applicationsAffected: 45,
      lastUpdated: "2024-02-08",
    },
    {
      id: "comp_4",
      name: "AML/CFT Requirements",
      description: "Anti-Money Laundering and Counter-Terrorist Financing",
      status: "at_risk",
      deadline: "2024-04-30",
      priority: "high",
      category: "Financial",
      applicationsAffected: 80,
      lastUpdated: "2024-02-07",
    },
    {
      id: "comp_5",
      name: "Digital Signature Act",
      description: "Compliance with Digital Signature Act, 2000",
      status: "compliant",
      deadline: "2024-12-31",
      priority: "medium",
      category: "Digital",
      applicationsAffected: 35,
      lastUpdated: "2024-02-06",
    },
    {
      id: "comp_6",
      name: "Income Tax Compliance",
      description: "Annual IT compliance and filing requirements",
      status: "non_compliant",
      deadline: "2024-03-31",
      priority: "high",
      category: "Tax",
      applicationsAffected: 25,
      lastUpdated: "2024-02-05",
    },
  ]);

  const filteredCompliance = complianceItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-100 text-green-700 border border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "at_risk":
        return "bg-orange-100 text-orange-700 border border-orange-200";
      case "non_compliant":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="w-5 h-5" />;
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "at_risk":
        return <AlertCircle className="w-5 h-5" />;
      case "non_compliant":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const compliantCount = complianceItems.filter(i => i.status === "compliant").length;
  const pendingCount = complianceItems.filter(i => i.status === "pending").length;
  const atRiskCount = complianceItems.filter(i => i.status === "at_risk").length;
  const nonCompliantCount = complianceItems.filter(i => i.status === "non_compliant").length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Compliance Management</h1>
            <p className="text-muted-foreground mt-1">Track and manage compliance requirements</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Compliance
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Compliant</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{compliantCount}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Pending</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-1">{pendingCount}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">At Risk</p>
                  <p className="text-3xl font-bold text-orange-900 mt-1">{atRiskCount}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-orange-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Non-Compliant</p>
                  <p className="text-3xl font-bold text-red-900 mt-1">{nonCompliantCount}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-400 opacity-50" />
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
                  placeholder="Search compliance items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="all">All Status</option>
                  <option value="compliant">Compliant</option>
                  <option value="pending">Pending</option>
                  <option value="at_risk">At Risk</option>
                  <option value="non_compliant">Non-Compliant</option>
                </select>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Items List */}
        <div className="space-y-4">
          {filteredCompliance.map((item) => (
            <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-foreground">{item.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(item.status)}`}>
                          {item.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>

                      {/* Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Category</p>
                          <p className="text-sm font-medium">{item.category}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Deadline</p>
                          <p className="text-sm font-medium">{new Date(item.deadline).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Priority</p>
                          <p className={`text-sm font-medium capitalize ${
                            item.priority === 'high' ? 'text-red-600' :
                            item.priority === 'medium' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {item.priority}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Apps Affected</p>
                          <p className="text-sm font-medium">{item.applicationsAffected}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCompliance.length === 0 && (
          <Card className="border-0 shadow-sm text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">No compliance items found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
