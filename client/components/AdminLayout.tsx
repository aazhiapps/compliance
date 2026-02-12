import { ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, LogOut, Home, Users, FileText, DollarSign, Settings, BarChart3, Package, CheckCircle2, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { icon: <BarChart3 className="w-5 h-5" />, label: "Dashboard", href: "/admin", id: "dashboard" },
    { icon: <Users className="w-5 h-5" />, label: "Users", href: "/admin/users", id: "users" },
    { icon: <FileText className="w-5 h-5" />, label: "Applications", href: "/admin/applications", id: "applications" },
    { icon: <Package className="w-5 h-5" />, label: "Services", href: "/admin/services", id: "services" },
    { icon: <CheckCircle2 className="w-5 h-5" />, label: "Compliance", href: "/admin/compliance", id: "compliance" },
    { icon: <File className="w-5 h-5" />, label: "Documents", href: "/admin/documents", id: "documents" },
    { icon: <DollarSign className="w-5 h-5" />, label: "Payments", href: "/admin/payments", id: "payments" },
    { icon: <Settings className="w-5 h-5" />, label: "Settings", href: "/admin/settings", id: "settings" },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-foreground text-white transition-all duration-300 flex flex-col shadow-lg`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              ⚙️
            </div>
            {sidebarOpen && <span className="font-bold text-lg">ComplianCe</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
              title={!sidebarOpen ? item.label : ""}
            >
              {item.icon}
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {sidebarOpen && (
            <div className="px-4 py-3 bg-white/10 rounded-lg">
              <p className="text-xs text-white/70">Logged in as</p>
              <p className="text-sm font-semibold truncate">{authUser?.firstName} {authUser?.lastName}</p>
              <p className="text-xs text-white/70 truncate">{authUser?.email}</p>
            </div>
          )}

          {/* Toggle Sidebar Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            {sidebarOpen && "Collapse"}
          </Button>

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            size="sm"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && "Logout"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-border px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {authUser?.firstName} {authUser?.lastName}
              </span>
              <Link to="/">
                <Button size="sm" variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
