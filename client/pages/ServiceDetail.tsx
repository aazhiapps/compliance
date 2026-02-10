import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  FileText,
  Users,
  Shield,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";

interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
  price: string;
  turnaround: string;
  features: string[];
  requirements: string[];
  documents: string[];
  faqs: Array<{ q: string; a: string }>;
}

const services: Record<number, Service> = {
  1: {
    id: 1,
    title: "GST Registration",
    description: "Easy GST registration and compliance for your business",
    icon: "📋",
    price: "₹499",
    turnaround: "2-3 days",
    features: [
      "Fast online registration",
      "GSTIN certificate",
      "Compliance support",
      "Expert guidance",
      "Lifetime support",
    ],
    requirements: [
      "Business PAN card",
      "Proof of business address",
      "Bank account details",
      "Authorized signatory details",
    ],
    documents: [
      "PAN card (copy)",
      "Aadhar card (copy)",
      "Business address proof",
      "Bank statement",
      "ITR (if applicable)",
    ],
    faqs: [
      {
        q: "Is GST registration mandatory for me?",
        a: "If your annual turnover exceeds ₹20 lakhs (₹10 lakhs for services), GST registration is mandatory.",
      },
      {
        q: "How long does GST registration take?",
        a: "Usually 2-3 days for approval after submission of all documents.",
      },
      {
        q: "Can I apply for GST online?",
        a: "Yes, the entire process is online. We handle the filing for you.",
      },
    ],
  },
  2: {
    id: 2,
    title: "Company Registration",
    description: "Register your company and get all legal documents",
    icon: "🏢",
    price: "₹2,999",
    turnaround: "7-10 days",
    features: [
      "Company registration (Pvt/Ltd)",
      "MOA & AOA preparation",
      "DIN certificate",
      "Certificate of Incorporation",
      "Director & Shareholder support",
    ],
    requirements: [
      "Director PAN card",
      "Director Aadhar card",
      "Shareholder details",
      "Registered office address",
      "Company memorandum",
    ],
    documents: [
      "PAN card (copy)",
      "Aadhar card (copy)",
      "Address proof",
      "Identity proof",
      "Residential proof",
    ],
    faqs: [
      {
        q: "What types of companies can I register?",
        a: "Private Limited, Public Limited, One Person Company (OPC), and Limited Liability Partnership (LLP).",
      },
      {
        q: "How many directors do I need?",
        a: "Minimum 1 director for private companies, minimum 2 for public companies.",
      },
      {
        q: "What are the fees involved?",
        a: "Our service fee is ₹2,999. Government fees vary based on company type.",
      },
    ],
  },
};

export default function ServiceDetail() {
  const { id } = useParams();
  const serviceId = id ? parseInt(id) : 1;
  const service = services[serviceId];

  if (!service) {
    return (
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Service Not Found</h1>
          <Link to="/">
            <Button>Go Back Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-border py-4 px-4">
        <div className="container mx-auto max-w-6xl">
          <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Services
          </Link>
        </div>
      </div>

      {/* Header Section */}
      <section className="py-12 md:py-16 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <div className="text-6xl mb-6">{service.icon}</div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                {service.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">{service.description}</p>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Starting Price</p>
                  <p className="text-3xl font-bold text-primary">{service.price}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Turnaround Time</p>
                  <p className="text-3xl font-bold text-primary flex items-center gap-2">
                    <Clock className="w-8 h-8" /> {service.turnaround}
                  </p>
                </div>
              </div>

              <Link to="/signup">
                <Button size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90">
                  Start Now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Info Box */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Why Choose ComplianCe?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Expert team with 10+ years experience</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Fast processing with guaranteed approval</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>100% secure & encrypted documents</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>24/7 customer support</span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span>Transparent pricing, no hidden fees</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-foreground mb-12">What's Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {service.features.map((feature, idx) => (
              <div key={idx} className="flex gap-4 p-4 border border-border rounded-lg hover:bg-gray-50">
                <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{feature}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Requirements */}
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Eligibility
              </h3>
              <ul className="space-y-3">
                {service.requirements.map((req, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-foreground">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Required Documents
              </h3>
              <ul className="space-y-3">
                {service.documents.map((doc, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-foreground">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-foreground mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {service.faqs.map((faq, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of satisfied customers. Start your {service.title.toLowerCase()} today.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary">
              Begin Application <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
