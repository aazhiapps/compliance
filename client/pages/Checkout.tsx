import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Lock,
  ArrowLeft,
  FileText,
  Clock,
  AlertCircle,
} from "lucide-react";
import DocumentUpload from "@/components/DocumentUpload";
import { useAuth } from "@/contexts/AuthContext";

interface Service {
  id: number;
  title: string;
  icon: string;
  price: string;
  priceAmount: number;
  turnaround: string;
  description: string;
  documents: string[];
}

const services: Record<number, Service> = {
  1: {
    id: 1,
    title: "GST Registration",
    icon: "📋",
    price: "₹499",
    priceAmount: 499,
    turnaround: "2-3 days",
    description: "Easy GST registration and compliance for your business",
    documents: ["PAN Card", "Aadhar Card", "Business Address Proof", "Bank Statement"],
  },
  2: {
    id: 2,
    title: "Company Registration",
    icon: "🏢",
    price: "₹2,999",
    priceAmount: 2999,
    turnaround: "7-10 days",
    description: "Register your company and get all legal documents",
    documents: ["PAN Card", "Aadhar Card", "Address Proof", "Residential Proof"],
  },
  3: {
    id: 3,
    title: "PAN Registration",
    icon: "🆔",
    price: "₹299",
    priceAmount: 299,
    turnaround: "1-2 days",
    description: "Fast PAN registration for individuals and businesses",
    documents: ["Aadhar Card", "Address Proof", "Photo"],
  },
};

interface UploadedFile {
  id: string;
  file: File;
  status: "uploading" | "success" | "error";
}

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const serviceId = id ? parseInt(id) : 1;
  const service = services[serviceId];

  const [step, setStep] = useState<"documents" | "review" | "payment">("documents");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const razorpayScriptRef = useRef<HTMLScriptElement | null>(null);

  // Cleanup Razorpay script on unmount
  useEffect(() => {
    return () => {
      if (razorpayScriptRef.current) {
        document.body.removeChild(razorpayScriptRef.current);
        razorpayScriptRef.current = null;
      }
    };
  }, []);

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Service Not Found</h1>
          <Button onClick={() => navigate("/")} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Please log in to proceed with your application
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const finalPrice = service.priceAmount - discount;

  const handleDocumentsChange = (files: UploadedFile[]) => {
    setUploadedFiles(files);
  };

  const handleApplyCoupon = (code: string) => {
    // Mock coupon validation
    if (code === "SAVE10") {
      setDiscount(Math.round(service.priceAmount * 0.1));
      setAppliedCoupon(code);
      setError(null);
    } else if (code) {
      setError("Invalid coupon code");
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Create application
      const appResponse = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId: service.id,
          serviceName: service.title,
        }),
      });

      if (!appResponse.ok) {
        throw new Error("Failed to create application");
      }

      const appData = await appResponse.json();
      const applicationId = appData.application.id;

      // Upload documents with error handling
      for (const uploadedFile of uploadedFiles) {
        if (uploadedFile.status === "success") {
          try {
            const formData = new FormData();
            formData.append("applicationId", applicationId);
            formData.append("fileName", uploadedFile.file.name);
            formData.append("fileType", uploadedFile.file.type);
            formData.append("fileUrl", `https://example.com/docs/${uploadedFile.file.name}`);

            const uploadResponse = await fetch("/api/applications/" + applicationId + "/documents", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            });

            if (!uploadResponse.ok) {
              console.error(`Failed to upload ${uploadedFile.file.name}`);
            }
          } catch (uploadError) {
            console.error(`Error uploading ${uploadedFile.file.name}:`, uploadError);
          }
        }
      }

      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_YOUR_KEY", // Get from environment variable
        amount: finalPrice * 100, // Amount in paise
        currency: "INR",
        name: "ComplianCe",
        description: `Payment for ${service.title}`,
        order_id: applicationId,
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: user.phone,
        },
        handler: function (_response: any) {
          // Payment successful
          toast({
            title: "Payment Successful!",
            description: "Your application has been submitted successfully.",
          });
          setTimeout(() => {
            navigate(`/dashboard`);
          }, 1000);
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      // Load and open Razorpay
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      };
      razorpayScriptRef.current = script;
      document.body.appendChild(script);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-4xl font-bold text-foreground">Complete Your Application</h1>
          <p className="text-muted-foreground mt-2">{service.title}</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex gap-4">
          {(["documents", "review", "payment"] as const).map((s, idx) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step === s
                    ? "bg-primary text-white"
                    : (["documents", "review"].includes(s) && step === "payment") ||
                        (s === "review" && step === "payment")
                      ? "bg-success text-white"
                      : "bg-gray-200 text-gray-600"
                }`}
              >
                {(["documents", "review"].includes(s) && step === "payment") ||
                (s === "review" && step === "payment") ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  idx + 1
                )}
              </div>
              <span className="text-sm font-medium capitalize hidden sm:inline">{s}</span>
              {idx < 2 && <div className="w-8 h-0.5 bg-gray-200"></div>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Documents Step */}
            {step === "documents" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Upload Required Documents
                  </CardTitle>
                  <CardDescription>
                    Please upload all required documents for verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Document Requirements */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-3">Required Documents:</p>
                    <ul className="space-y-2">
                      {service.documents.map((doc, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-blue-900">
                          <CheckCircle className="w-4 h-4" />
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Upload Component */}
                  <DocumentUpload
                    onDocumentsChange={handleDocumentsChange}
                    maxFiles={10}
                    maxFileSize={10}
                  />

                  {/* Error Display */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {/* Next Button */}
                  <Button
                    onClick={() => setStep("review")}
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={uploadedFiles.filter((f) => f.status === "success").length === 0}
                  >
                    Continue to Review
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Review Step */}
            {step === "review" && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Application</CardTitle>
                  <CardDescription>Please review all details before payment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Application Details */}
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <h3 className="font-semibold mb-3">Service Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service</span>
                          <span className="font-medium">{service.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estimated Time</span>
                          <span className="font-medium flex items-center gap-1">
                            <Clock className="w-4 h-4" /> {service.turnaround}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Personal Details */}
                    <div className="border-b pb-4">
                      <h3 className="font-semibold mb-3">Your Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name</span>
                          <span className="font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email</span>
                          <span className="font-medium">{user.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone</span>
                          <span className="font-medium">{user.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div>
                      <h3 className="font-semibold mb-3">Uploaded Documents</h3>
                      <div className="space-y-2">
                        {uploadedFiles
                          .filter((f) => f.status === "success")
                          .map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded"
                            >
                              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                              <span className="truncate">{file.file.name}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep("documents")}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep("payment")}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Step */}
            {step === "payment" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    Secure Payment
                  </CardTitle>
                  <CardDescription>Complete your payment securely via Razorpay</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Payment Methods */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Secure payment powered by Razorpay
                    </p>
                  </div>

                  {/* Payment Button */}
                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full bg-primary hover:bg-primary/90 text-lg h-12"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      "Pay Now with Razorpay"
                    )}
                  </Button>

                  {/* Navigation */}
                  <Button
                    variant="outline"
                    onClick={() => setStep("review")}
                    className="w-full"
                    disabled={isProcessing}
                  >
                    Back to Review
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Service Info */}
                <div className="flex gap-3 pb-4 border-b">
                  <div className="text-2xl">{service.icon}</div>
                  <div>
                    <p className="font-semibold text-sm">{service.title}</p>
                    <p className="text-xs text-muted-foreground">{service.turnaround}</p>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service Price</span>
                    <span className="font-medium">{service.price}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-success">Discount ({appliedCoupon})</span>
                      <span className="font-medium text-success">-₹{discount}</span>
                    </div>
                  )}

                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">Total Amount</span>
                    <span className="font-bold text-lg text-primary">₹{finalPrice}</span>
                  </div>
                </div>

                {/* Coupon Code */}
                <div className="pt-2 border-t space-y-2">
                  <label className="text-sm font-medium">Have a coupon code?</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      defaultValue={appliedCoupon || ""}
                      onChange={(e) => {
                        if (!e.target.value) {
                          setDiscount(0);
                          setAppliedCoupon(null);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          const input = e.currentTarget;
                          handleApplyCoupon(input.value);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        const input = (e.currentTarget.parentElement?.querySelector(
                          "input"
                        ) as HTMLInputElement) || null;
                        if (input) {
                          handleApplyCoupon(input.value);
                        }
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>

                {/* Features */}
                <div className="pt-4 border-t space-y-2">
                  <h4 className="text-sm font-semibold">What's Included</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      Expert verification
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      100% secure filing
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      Real-time tracking
                    </li>
                    <li className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      Money-back guarantee
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
