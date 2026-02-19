import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

/**
 * Back Button Component
 * Provides consistent navigation back button across pages
 */
export function BackButton({ to, label = "Back", className }: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={cn("gap-2", className)}
      aria-label={`Navigate back to ${label.toLowerCase()}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
