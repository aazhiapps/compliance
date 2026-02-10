import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function PlaceholderPage({
  title,
  description,
  icon = <FileText className="w-16 h-16 text-muted-foreground" />,
}: PlaceholderPageProps) {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-12">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">{icon}</div>
        <h1 className="text-3xl font-bold text-foreground mb-4">{title}</h1>
        <p className="text-lg text-muted-foreground mb-8">{description}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Prompt */}
        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            This page is coming soon. Feel free to ask me to build this page - just provide details about what should be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
}
