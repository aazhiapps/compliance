import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mail,
  Lock,
  User,
  Phone,
  Globe,
  CheckCircle,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isValidEmail, validatePasswordStrength } from "@/lib/utils";

export default function Signup() {
  const [step, setStep] = useState(1);
  const { signup, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    language: "en",
    businessType: "individual",
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError(null);
  };

  const handleNext = () => {
    // Validate step 1 (personal info)
    if (step === 1) {
      if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
        setLocalError("Please enter your full name");
        return;
      }
      if (!formData.email?.trim()) {
        setLocalError("Please enter your email");
        return;
      }
      if (!isValidEmail(formData.email)) {
        setLocalError("Please enter a valid email address");
        return;
      }
      if (!formData.phone?.trim()) {
        setLocalError("Please enter your phone number");
        return;
      }
    }

    // Validate step 2 (password)
    if (step === 2) {
      const passwordValidation = validatePasswordStrength(formData.password);
      if (!passwordValidation.valid) {
        setLocalError(passwordValidation.message || "Invalid password");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setLocalError("Passwords do not match");
        return;
      }
    }

    if (step < 3) setStep(step + 1);
  };

  const handleSubmit = async () => {
    try {
      await signup(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.phone,
        formData.businessType,
        formData.language,
      );
      navigate("/dashboard");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Progress Indicator */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-gray-200"
              }`}
            ></div>
          ))}
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {step === 1 && "Create Account"}
              {step === 2 && "Contact Information"}
              {step === 3 && "Preferences"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Join ComplianCe to manage your compliance"}
              {step === 2 && "How can we reach you?"}
              {step === 3 && "Customize your experience"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Display */}
            {(error || localError) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error || localError}</p>
              </div>
            )}

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      name="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Contact Info */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Preferences */}
            {step === 3 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Language
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Business Type
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="individual">Individual</option>
                    <option value="startup">Startup</option>
                    <option value="company">Company</option>
                    <option value="nonprofit">Non-Profit</option>
                  </select>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    ✓ By signing up, you agree to our Terms of Service and
                    Privacy Policy
                  </p>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(step - 1)}
                  disabled={isLoading}
                >
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  Next <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" /> Create Account
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Sign In Link */}
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Demo:</strong> This is a multi-step signup form. The actual
            backend integration will be added with your authentication system.
          </p>
        </div>
      </div>
    </div>
  );
}
