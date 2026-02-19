import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Target,
  Users,
  Shield,
  Award,
  CheckCircle,
} from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <Link to="/">
            <Button variant="outline" className="mb-6 text-primary bg-white hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-5xl font-bold mb-4">About ComplianCe</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Simplifying compliance management for businesses of all sizes
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 py-12 space-y-12">
        {/* Mission */}
        <section>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Target className="w-8 h-8 text-primary" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground leading-relaxed">
                At ComplianCe, we believe that compliance should be simple,
                transparent, and accessible to everyone. Our mission is to
                empower businesses by removing the complexity from regulatory
                compliance, allowing them to focus on what they do best -
                growing their business.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* What We Do */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-6">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-primary" />
                  Compliance Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We handle all aspects of business compliance, from GST
                  registration to company incorporation, ensuring you meet all
                  regulatory requirements.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  Expert Guidance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our team of compliance experts provides personalized support
                  throughout your journey, answering questions and resolving
                  issues quickly.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-primary" />
                  Quality Assurance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Every application is thoroughly reviewed by our quality team
                  to ensure accuracy and completeness before submission to
                  authorities.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-primary" />
                  End-to-End Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  From document collection to final approval, we manage the
                  entire compliance process, keeping you informed at every step.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Why Choose Us */}
        <section>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader>
              <CardTitle className="text-3xl">Why Choose ComplianCe?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">Fast Processing</h3>
                    <p className="text-muted-foreground">
                      Most applications processed within 5-7 business days
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">Transparent Pricing</h3>
                    <p className="text-muted-foreground">
                      No hidden charges - what you see is what you pay
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">Dedicated Support</h3>
                    <p className="text-muted-foreground">
                      Personal support from assigned compliance specialists
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">Secure & Confidential</h3>
                    <p className="text-muted-foreground">
                      Bank-level security for all your documents and data
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Call to Action */}
        <section className="text-center py-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of businesses that trust ComplianCe for their
            compliance needs.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Sign Up Now
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline">
                Contact Us
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
