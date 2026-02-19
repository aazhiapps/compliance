import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import PlaceholderPage from "@/components/PlaceholderPage";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";

// Immediate load for critical pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Lazy load for less critical pages
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MyDocuments = lazy(() => import("./pages/MyDocuments"));
const ApplicationTracking = lazy(() => import("./pages/ApplicationTracking"));

// Lazy load admin pages (heavy components)
const AdminOverview = lazy(() => import("./pages/AdminOverview"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminApplications = lazy(() => import("./pages/AdminApplications"));
const AdminApplicationDetail = lazy(() => import("./pages/AdminApplicationDetail"));
const AdminPayments = lazy(() => import("./pages/AdminPayments"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminServices = lazy(() => import("./pages/AdminServices"));
const AdminCompliance = lazy(() => import("./pages/AdminCompliance"));
const AdminDocuments = lazy(() => import("./pages/AdminDocuments"));
const AdminGST = lazy(() => import("./pages/AdminGST"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminClients = lazy(() => import("./pages/AdminClients"));
const AdminClientDetail = lazy(() => import("./pages/AdminClientDetail"));

// Lazy load staff pages
const StaffDashboard = lazy(() => import("./pages/StaffDashboard"));

// Lazy load GST pages
const UserGST = lazy(() => import("./pages/UserGST"));
const GSTSummary = lazy(() => import("./pages/GSTSummary"));

// Lazy load info pages
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

import {
  BookOpen,
  Users,
  HelpCircle,
  Briefcase,
  Shield,
  FileText,
} from "lucide-react";

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" message="Loading page..." />
  </div>
);

const AppRoutes = () => (
  <Routes>
    {/* Public routes - no lazy loading */}
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    
    {/* Lazy loaded public routes */}
    <Route path="/service/:id" element={
      <Suspense fallback={<PageLoader />}>
        <ServiceDetail />
      </Suspense>
    } />
    <Route path="/checkout/:id" element={
      <Suspense fallback={<PageLoader />}>
        <Checkout />
      </Suspense>
    } />
    <Route path="/about" element={
      <Suspense fallback={<PageLoader />}>
        <About />
      </Suspense>
    } />
    <Route path="/contact" element={
      <Suspense fallback={<PageLoader />}>
        <Contact />
      </Suspense>
    } />

    {/* Protected Routes - lazy loaded */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/documents"
      element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <MyDocuments />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/application/:id"
      element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <ApplicationTracking />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/gst-filing"
      element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <UserGST />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/gst-summary"
      element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <GSTSummary />
          </Suspense>
        </ProtectedRoute>
      }
    />
    {/* Admin Routes - lazy loaded with suspense */}
    <Route
      path="/admin"
      element={
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={<PageLoader />}>
            <AdminOverview />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/users"
      element={
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={<PageLoader />}>
            <AdminUsers />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/applications"
      element={
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={<PageLoader />}>
            <AdminApplications />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/applications/:id"
      element={
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={<PageLoader />}>
            <AdminApplicationDetail />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/payments"
      element={
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={<PageLoader />}>
            <AdminPayments />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/settings"
      element={
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={<PageLoader />}>
            <AdminSettings />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/services"
      element={
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={<PageLoader />}>
            <AdminServices />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/compliance"
      element={
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={<PageLoader />}>
            <AdminCompliance />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/documents"
      element={
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={<PageLoader />}>
            <AdminDocuments />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/gst"
      element={
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={<PageLoader />}>
            <AdminGST />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/reports"
      element={
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={<PageLoader />}>
            <AdminReports />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/clients"
      element={
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={<PageLoader />}>
            <AdminClients />
          </Suspense>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/clients/:id"
      element={
        <ProtectedRoute requiredRole="admin">
          <Suspense fallback={<PageLoader />}>
            <AdminClientDetail />
          </Suspense>
        </ProtectedRoute>
      }
    />

    {/* Staff Routes - lazy loaded */}
    <Route
      path="/staff"
      element={
        <ProtectedRoute requiredRole="staff">
          <Suspense fallback={<PageLoader />}>
            <StaffDashboard />
          </Suspense>
        </ProtectedRoute>
      }
    />

    {/* Catch-all route - lazy loaded */}
    <Route path="*" element={
      <Suspense fallback={<PageLoader />}>
        <NotFound />
      </Suspense>
    } />
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
    {/* Catch-all route is already defined above with lazy loading */}
  </Routes>
);

const App = () => (
  <ErrorBoundary>
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
  </ErrorBoundary>
);

// Initialize the React root
import type { Root } from "react-dom/client";

let root: Root | null = null;

const renderApp = () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  if (!root) {
    root = createRoot(rootElement);
  }
  root.render(<App />);
};

renderApp();

// Handle Vite HMR to prevent duplicate createRoot warnings
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    renderApp();
  });
}
