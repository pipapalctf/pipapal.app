import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type AccessDeniedProps = {
  title?: string;
  message?: string;
  showBackHome?: boolean;
};

/**
 * Displays an access denied message with an option to navigate back to the home page
 */
export default function AccessDenied({
  title = "Access Denied",
  message = "You don't have permission to access this feature.",
  showBackHome = true
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="bg-red-100 p-3 rounded-full mb-6">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {title}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        {showBackHome && (
          <Link href="/dashboard">
            <Button>
              Back to Dashboard
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}