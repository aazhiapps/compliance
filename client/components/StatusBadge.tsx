import { cn } from "@/lib/utils";
import { CheckCircle, Clock, XCircle, AlertCircle, FileText } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export default function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case "approved":
      case "completed":
      case "success":
      case "active":
      case "paid":
        return {
          className: "status-badge status-success",
          icon: <CheckCircle className="w-3 h-3" />,
          label: status.charAt(0).toUpperCase() + status.slice(1),
        };
      
      case "pending":
      case "in_progress":
      case "processing":
        return {
          className: "status-badge status-warning",
          icon: <Clock className="w-3 h-3" />,
          label: status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1),
        };
      
      case "rejected":
      case "failed":
      case "cancelled":
      case "inactive":
        return {
          className: "status-badge status-error",
          icon: <XCircle className="w-3 h-3" />,
          label: status.charAt(0).toUpperCase() + status.slice(1),
        };
      
      case "submitted":
      case "review":
      case "under_review":
        return {
          className: "status-badge status-info",
          icon: <FileText className="w-3 h-3" />,
          label: status === "under_review" ? "Under Review" : status.charAt(0).toUpperCase() + status.slice(1),
        };
      
      default:
        return {
          className: "status-badge status-pending",
          icon: <AlertCircle className="w-3 h-3" />,
          label: status.charAt(0).toUpperCase() + status.slice(1),
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={cn(config.className, className)}>
      {showIcon && config.icon}
      <span className={showIcon ? "ml-1" : ""}>{config.label}</span>
    </span>
  );
}
