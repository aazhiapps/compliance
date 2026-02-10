import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  Zap,
  Shield,
  Users,
  FileText,
  CreditCard,
  ArrowRight,
  Clock,
  TrendingUp,
  Lock,
} from "lucide-react";

const services = [
  {
    id: 1,
    title: "GST Registration",
    description: "Easy GST registration and compliance for your business",
    icon: "📋",
    price: "₹499",
    turnaround: "2-3 days",
    features: ["GST registration", "GSTIN certificate", "Compliance support"],
  },
  {
    id: 2,
    title: "Company Registration",
    description: "Register your company and get all legal documents",
    icon: "🏢",
    price: "₹2,999",
    turnaround: "7-10 days",
    features: ["Company registration", "MOA & AOA", "DIN certificate"],
  },
  {
    id: 3,
    title: "PAN Registration",
    description: "Fast PAN registration for individuals and businesses",
    icon: "🆔",
    price: "₹299",
    turnaround: "1-2 days",
    features: ["PAN registration", "Instant certificate", "Legal compliance"],
  },
  {
    id: 4,
    title: "Trademark Registration",
    description: "Protect your brand with trademark registration",
    icon: "™️",
    price: "₹5,999",
    turnaround: "4-6 weeks",
    features: ["Logo protection", "Brand name", "Complete filing"],
  },
  {
    id: 5,
    title: "Compliance Audit",
    description: "Annual compliance audit and tax planning",
    icon: "✅",
    price: "₹3,999",
    turnaround: "5-7 days",
    features: ["Full audit", "Tax planning", "Legal advising"],
  },
  {
    id: 6,
    title: "Legal Documents",
    description: "Get all necessary legal documents for your business",
    icon: "📄",
    price: "₹1,999",
    turnaround: "2-3 days",
    features: ["Custom documents", "Legal review", "Unlimited updates"],
  },
];

const features = [
  {
    icon: <Zap className="w-6 h-6 text-primary" />,
    title: "Fast Turnaround",
    description: "Get your documents ready in record time with our efficient process",
  },
  {
    icon: <Shield className="w-6 h-6 text-primary" />,
    title: "100% Secure",
    description: "Your data is encrypted and stored securely with bank-level protection",
  },
  {
    icon: <Users className="w-6 h-6 text-primary" />,
    title: "Expert Support",
    description: "Get personalized support from our team of compliance experts",
  },
  {
    icon: <FileText className="w-6 h-6 text-primary" />,
    title: "Complete Tracking",
    description: "Track your application status in real-time with detailed updates",
  },
  {
    icon: <CreditCard className="w-6 h-6 text-primary" />,
    title: "Transparent Pricing",
    description: "No hidden charges, what you see is what you pay",
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-primary" />,
    title: "Approval Guarantee",
    description: "We ensure your application is approved or 100% money back",
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Select Service",
    description: "Choose the service you need from our catalog",
  },
  {
    step: 2,
    title: "Upload Documents",
    description: "Upload required documents securely to our platform",
  },
  {
    step: 3,
    title: "Expert Review",
    description: "Our experts review and validate your documents",
  },
  {
    step: 4,
    title: "File & Track",
    description: "We file your application and you track in real-time",
  },
];

export default function Index() {
  const [selectedService, setSelectedService] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-12 md:py-24 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
                Business Compliance Made Simple
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Register your company, file GST, and handle all compliance requirements with ease. 
                Get expert support from registration to approval.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-base">
                    Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base">
                  View All Services
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="mt-12 space-y-3">
                <p className="text-sm text-muted-foreground font-medium">Trusted by 50,000+ businesses</p>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="text-sm font-medium">GST Approved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="text-sm font-medium">ISO Certified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="text-sm font-medium">DSIR Recognized</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="hidden md:block">
              <div className="bg-gradient-to-br from-primary to-secondary rounded-3xl p-12 text-white flex flex-col justify-center items-center h-96">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-xl font-semibold">Your Compliance Dashboard</p>
                  <p className="text-blue-100 mt-2">Track all applications in one place</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive compliance and business registration services tailored for your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card
                key={service.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary ${
                  selectedService === service.id ? "border-primary ring-2 ring-primary/20" : ""
                }`}
                onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
              >
                <CardHeader>
                  <div className="text-5xl mb-4">{service.icon}</div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">{service.price}</span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {service.turnaround}
                      </span>
                    </div>
                  </div>

                  {selectedService === service.id && (
                    <div className="space-y-2 pt-4 border-t">
                      <p className="text-sm font-medium text-foreground">What's Included:</p>
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Link to={`/service/${service.id}`}>
                    <Button className="w-full mt-4 bg-primary hover:bg-primary/90">
                      Learn More <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple 4-step process to get your documents ready
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="relative">
                {/* Connection Line */}
                {idx < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
                )}

                {/* Card */}
                <div className="relative z-10">
                  <div className="bg-white rounded-xl p-6 text-center border border-border">
                    <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose ComplianCe</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We provide the best compliance services with expert support and transparent pricing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Flexible Plans</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose a plan that fits your business needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Basic</CardTitle>
                <CardDescription>Perfect for startups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-4xl font-bold text-primary">₹499</span>
                  <span className="text-muted-foreground ml-2">/service</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Single service filing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Document verification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Email support</span>
                  </li>
                  <li className="flex items-center gap-2 opacity-50">
                    <CheckCircle className="w-4 h-4 text-gray-300" />
                    <span className="text-sm">Priority support</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="border-primary border-2">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <CardTitle>Professional</CardTitle>
                    <CardDescription>Most popular</CardDescription>
                  </div>
                  <span className="text-xs bg-primary text-white px-3 py-1 rounded-full">POPULAR</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-4xl font-bold text-primary">₹1,999</span>
                  <span className="text-muted-foreground ml-2">/month</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Multiple services</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">OCR document scanning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Priority phone support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Dedicated executive</span>
                  </li>
                </ul>
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>For large teams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-4xl font-bold text-primary">Custom</span>
                  <span className="text-muted-foreground ml-2">/year</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Unlimited services</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">API access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">24/7 dedicated support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm">Custom integration</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of businesses that trust ComplianCe for their compliance needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="text-base">
                Create Free Account <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-base">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
