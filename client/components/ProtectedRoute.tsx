import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PlaceholderPage from "@/components/PlaceholderPage";
import { Shield } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "user" | "admin" | "executive";
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== "admin") {
    return (
      <PlaceholderPage
        title="Access Denied"
        description="You don't have permission to access this page"
        icon={<Shield className="w-16 h-16 text-destructive" />}
      />
    );
  }

  return <>{children}</>;
};
