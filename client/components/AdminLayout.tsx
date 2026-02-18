import { ReactNode, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Menu,
  X,
  LogOut,
  Home,
  Users,
  FileText,
  DollarSign,
  Settings,
  BarChart3,
  Package,
  CheckCircle2,
  File,
  Receipt,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Closed by default on mobile
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  const location = useLocation();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebarOnMobile = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/admin") return "Dashboard";
    if (path.includes("/admin/users")) return "User Management";
    if (path.includes("/admin/clients")) return "Client Management";
    if (path.includes("/admin/applications")) return "Applications";
    if (path.includes("/admin/services")) return "Services";
    if (path.includes("/admin/compliance")) return "Compliance";
    if (path.includes("/admin/gst")) return "GST Filing";
    if (path.includes("/admin/documents")) return "Documents";
    if (path.includes("/admin/payments")) return "Payments";
    if (path.includes("/admin/reports")) return "Reports";
    if (path.includes("/admin/settings")) return "Settings";
    return "Admin Dashboard";
  };

  const navItems = [
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: "Dashboard",
      href: "/admin",
      id: "dashboard",
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Users",
      href: "/admin/users",
      id: "users",
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Clients",
      href: "/admin/clients",
      id: "clients",
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Applications",
      href: "/admin/applications",
      id: "applications",
    },
    {
      icon: <Package className="w-5 h-5" />,
      label: "Services",
      href: "/admin/services",
      id: "services",
    },
    {
      icon: <CheckCircle2 className="w-5 h-5" />,
      label: "Compliance",
      href: "/admin/compliance",
      id: "compliance",
    },
    {
      icon: <Receipt className="w-5 h-5" />,
      label: "GST Filing",
      href: "/admin/gst",
      id: "gst",
    },
    {
      icon: <File className="w-5 h-5" />,
      label: "Documents",
      href: "/admin/documents",
      id: "documents",
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      label: "Payments",
      href: "/admin/payments",
      id: "payments",
    },
    {
      icon: <BarChart2 className="w-5 h-5" />,
      label: "Reports",
      href: "/admin/reports",
      id: "reports",
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: "Settings",
      href: "/admin/settings",
      id: "settings",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebarOnMobile}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${
          sidebarOpen && !isMobile ? "md:w-64" : "md:w-20"
        } fixed md:relative inset-y-0 left-0 z-50 w-64 bg-foreground text-white transition-all duration-300 flex flex-col shadow-lg`}
      >
        {/* Logo */}
        <div className="p-4 md:p-6 border-b border-white/10">
          <Link
            to="/admin"
            className="flex items-center gap-3"
            onClick={closeSidebarOnMobile}
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              ⚙️
            </div>
            {(sidebarOpen || isMobile) && (
              <span className="font-bold text-lg">ComplianCe</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.id}
                to={item.href}
                onClick={closeSidebarOnMobile}
                className={`flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "hover:bg-white/10 text-white/90"
                }`}
                title={!sidebarOpen && !isMobile ? item.label : ""}
              >
                {item.icon}
                {(sidebarOpen || isMobile) && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 md:p-4 border-t border-white/10 space-y-2 md:space-y-3">
          {(sidebarOpen || isMobile) && (
            <div className="px-3 md:px-4 py-2 md:py-3 bg-white/10 rounded-lg">
              <p className="text-xs text-white/70">Logged in as</p>
              <p className="text-sm font-semibold truncate">
                {authUser?.firstName} {authUser?.lastName}
              </p>
              <p className="text-xs text-white/70 truncate">
                {authUser?.email}
              </p>
            </div>
          )}

          {/* Toggle Sidebar Button - Desktop only */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSidebar}
            className="hidden md:flex w-full bg-white/10 border-white/20 text-white hover:bg-white/20 items-center justify-center gap-2"
          >
            {sidebarOpen ? (
              <>
                <X className="w-4 h-4" />
                {sidebarOpen && <span>Collapse</span>}
              </>
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </Button>

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
            size="sm"
          >
            <LogOut className="w-4 h-4" />
            {(sidebarOpen || isMobile) && <span>Logout</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-border px-4 md:px-6 py-3 md:py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="md:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-lg md:text-2xl font-bold text-foreground">
                {getPageTitle()}
              </h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <span className="hidden md:inline text-sm text-muted-foreground">
                {authUser?.firstName} {authUser?.lastName}
              </span>
              <Link to="/">
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="p-4 md:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
