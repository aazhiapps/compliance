import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PlaceholderPage from "@/components/PlaceholderPage";
import { Shield } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "user" | "admin" | "staff";
}

export const ProtectedRoute = ({
  children,
  requiredRole,
}: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Admin has access to all routes
  if (requiredRole && user?.role !== "admin") {
    // Staff role check
    if (requiredRole === "staff" && user?.role !== "staff") {
      return (
        <PlaceholderPage
          title="Access Denied"
          description="You don't have permission to access this page. Staff access required."
          icon={<Shield className="w-16 h-16 text-destructive" />}
        />
      );
    }

    // Other role checks
    if (user?.role !== requiredRole) {
      return (
        <PlaceholderPage
          title="Access Denied"
          description="You don't have permission to access this page"
          icon={<Shield className="w-16 h-16 text-destructive" />}
        />
      );
    }
  }

  return <>{children}</>;
};
