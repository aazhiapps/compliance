import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PlaceholderPage from "@/components/PlaceholderPage";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ServiceDetail from "./pages/ServiceDetail";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/service/:id" element={<ServiceDetail />} />

              {/* Placeholder Routes */}
              <Route
                path="/dashboard"
                element={
                  <PlaceholderPage
                    title="Dashboard"
                    description="View all your applications and track their status"
                    icon={<BarChart3 className="w-16 h-16 text-muted-foreground" />}
                  />
                }
              />
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
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
