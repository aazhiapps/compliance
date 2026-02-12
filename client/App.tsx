import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import PlaceholderPage from "@/components/PlaceholderPage";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ServiceDetail from "./pages/ServiceDetail";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import AdminOverview from "./pages/AdminOverview";
import AdminUsers from "./pages/AdminUsers";
import AdminApplications from "./pages/AdminApplications";
import AdminPayments from "./pages/AdminPayments";
import AdminSettings from "./pages/AdminSettings";
import ApplicationTracking from "./pages/ApplicationTracking";
import NotFound from "./pages/NotFound";
import {
  BarChart3,
  BookOpen,
  Users,
  HelpCircle,
  Briefcase,
  Shield,
  FileText,
} from "lucide-react";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/service/:id" element={<ServiceDetail />} />
    <Route path="/checkout/:id" element={<Checkout />} />

    {/* Protected Routes */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/application/:id"
      element={
        <ProtectedRoute>
          <ApplicationTracking />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminOverview />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/users"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminUsers />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/applications"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminApplications />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/payments"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminPayments />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/settings"
      element={
        <ProtectedRoute requiredRole="admin">
          <AdminSettings />
        </ProtectedRoute>
      }
    />

    {/* Placeholder Routes */}
    <Route
      path="/about"
      element={
        <PlaceholderPage
          title="About Us"
          description="Learn more about ComplianCe and our mission"
          icon={<Briefcase className="w-16 h-16 text-muted-foreground" />}
        />
      }
    />
    <Route
      path="/blog"
      element={
        <PlaceholderPage
          title="Blog"
          description="Read our latest articles on compliance and business"
          icon={<BookOpen className="w-16 h-16 text-muted-foreground" />}
        />
      }
    />
    <Route
      path="/careers"
      element={
        <PlaceholderPage
          title="Careers"
          description="Join our team and help businesses succeed"
          icon={<Users className="w-16 h-16 text-muted-foreground" />}
        />
      }
    />
    <Route
      path="/contact"
      element={
        <PlaceholderPage
          title="Contact Us"
          description="Get in touch with our support team"
          icon={<HelpCircle className="w-16 h-16 text-muted-foreground" />}
        />
      }
    />
    <Route
      path="/privacy"
      element={
        <PlaceholderPage
          title="Privacy Policy"
          description="Learn how we protect your data"
          icon={<Shield className="w-16 h-16 text-muted-foreground" />}
        />
      }
    />
    <Route
      path="/terms"
      element={
        <PlaceholderPage
          title="Terms of Service"
          description="Read our terms and conditions"
          icon={<FileText className="w-16 h-16 text-muted-foreground" />}
        />
      }
    />
    <Route
      path="/security"
      element={
        <PlaceholderPage
          title="Security"
          description="Learn about our security measures"
          icon={<Shield className="w-16 h-16 text-muted-foreground" />}
        />
      }
    />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
