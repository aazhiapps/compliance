import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Globe, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { label: language === "en" ? "Services" : "सेवाएं", href: "/#services" },
    { label: language === "en" ? "How it Works" : "यह कैसे काम करता है", href: "/#how-it-works" },
    { label: language === "en" ? "Pricing" : "मूल्य निर्धारण", href: "/#pricing" },
    { label: language === "en" ? "Blog" : "ब्लॉग", href: "/blog" },
  ];

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "hi" : "en");
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl md:text-2xl text-primary">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary text-white rounded-lg flex items-center justify-center">
              ⚙️
            </div>
            <span>{language === "en" ? "ComplianCe" : "सम्पूर्ण"}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors font-medium text-sm"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="p-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-2 text-sm"
              title={language === "en" ? "Switch to Hindi" : "Switch to English"}
            >
              <Globe className="w-4 h-4" />
              <span className="hidden md:inline">{language === "en" ? "EN" : "HI"}</span>
            </button>

            {/* Auth Buttons - Desktop */}
            <div className="hidden md:flex gap-2 items-center">
              {isAuthenticated && user ? (
                <>
                  {user.role === "admin" ? (
                    <Link to="/admin">
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        {language === "en" ? "Admin" : "एडमिन"}
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/dashboard">
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        {language === "en" ? "Dashboard" : "डैशबोर्ड"}
                      </Button>
                    </Link>
                  )}
                  <div className="h-6 w-px bg-border"></div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {language === "en" ? "Logout" : "लॉग आउट"}
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      {language === "en" ? "Sign In" : "साइन इन करें"}
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      {language === "en" ? "Get Started" : "शुरुआत करें"}
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-muted rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="px-4 py-2 border-t border-border flex flex-col gap-2 pt-4">
                {isAuthenticated && user ? (
                  <>
                    {user.role === "admin" ? (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2">
                          <LayoutDashboard className="w-4 h-4" />
                          {language === "en" ? "Admin" : "एडमिन"}
                        </Button>
                      </Link>
                    ) : (
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2">
                          <LayoutDashboard className="w-4 h-4" />
                          {language === "en" ? "Dashboard" : "डैशबोर्ड"}
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      {language === "en" ? "Logout" : "लॉग आउट"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">
                        {language === "en" ? "Sign In" : "साइन इन करें"}
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                        {language === "en" ? "Get Started" : "शुरुआत करें"}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
