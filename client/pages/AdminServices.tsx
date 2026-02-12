import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Plus, Edit, Trash2, Eye, MoreVertical, Package, TrendingUp } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  turnaround: string;
  category: string;
  documentsRequired: number;
  active: boolean;
  applicationsCount: number;
  revenue: number;
}

export default function AdminServices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [services, setServices] = useState<Service[]>([
    {
      id: "svc_1",
      name: "GST Registration",
      description: "Register for Goods and Services Tax",
      price: 2999,
      turnaround: "5-7 days",
      category: "Tax",
      documentsRequired: 3,
      active: true,
      applicationsCount: 45,
      revenue: 134955,
    },
    {
      id: "svc_2",
      name: "Company Registration",
      description: "Register a new company with ROC",
      price: 4999,
      turnaround: "10-15 days",
      category: "Business",
      documentsRequired: 5,
      active: true,
      applicationsCount: 32,
      revenue: 159968,
    },
    {
      id: "svc_3",
      name: "PAN Registration",
      description: "Apply for Permanent Account Number",
      price: 799,
      turnaround: "2-3 days",
      category: "Tax",
      documentsRequired: 2,
      active: true,
      applicationsCount: 89,
      revenue: 71111,
    },
    {
      id: "svc_4",
      name: "Trademark Registration",
      description: "Register your brand/trademark",
      price: 5999,
      turnaround: "8-10 days",
      category: "IP",
      documentsRequired: 4,
      active: true,
      applicationsCount: 18,
      revenue: 107982,
    },
    {
      id: "svc_5",
      name: "Import Export Code",
      description: "Get IEC for international trade",
      price: 3499,
      turnaround: "7-10 days",
      category: "Trade",
      documentsRequired: 3,
      active: true,
      applicationsCount: 25,
      revenue: 87475,
    },
  ]);

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || service.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "Tax", "Business", "IP", "Trade"];
  const totalRevenue = services.reduce((sum, s) => sum + s.revenue, 0);
  const activeServices = services.filter(s => s.active).length;
  const totalApplications = services.reduce((sum, s) => sum + s.applicationsCount, 0);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Services Management</h1>
            <p className="text-muted-foreground mt-1">Manage and configure all services</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Service
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Services</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{services.length}</p>
                </div>
                <Package className="w-10 h-10 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Active</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{activeServices}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Applications</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">{totalApplications}</p>
                </div>
                <Package className="w-10 h-10 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-orange-900 mt-1">₹{(totalRevenue / 100).toFixed(0)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-orange-400 opacity-50" />
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
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </option>
                  ))}
                </select>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredServices.map((service) => (
            <Card key={service.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription className="mt-1">{service.description}</CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    service.active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {service.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Service Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="text-lg font-bold text-blue-600">₹{service.price}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Turnaround</p>
                    <p className="text-lg font-bold text-purple-600">{service.turnaround}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Applications</p>
                    <p className="text-lg font-bold text-green-600">{service.applicationsCount}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-lg font-bold text-orange-600">₹{(service.revenue / 100).toFixed(0)}</p>
                  </div>
                </div>

                {/* Documents and Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{service.documentsRequired} documents required</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                      <Edit className="w-4 h-4" />
                      Edit
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

        {filteredServices.length === 0 && (
          <Card className="border-0 shadow-sm text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">No services found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
