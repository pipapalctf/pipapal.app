import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertTriangle } from "lucide-react";
import { Redirect, Route } from "wouter";
import { UserRoleType } from "@shared/schema";

export function ProtectedRoute({
  path,
  component: Component,
  roleCheck,
  skipOnboardingCheck = false, // Added parameter to optionally skip onboarding check
}: {
  path: string;
  component: () => React.JSX.Element;
  roleCheck?: UserRoleType;
  skipOnboardingCheck?: boolean; // For routes like onboarding itself
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : user ? (
        // Check for onboarding completion
        !skipOnboardingCheck && user.onboardingCompleted === false ? (
          <Redirect to="/onboarding" />
        ) : (
          // If roleCheck is specified, verify user has the required role
          roleCheck && user.role !== roleCheck ? (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
              <p className="text-muted-foreground mb-6 max-w-md">
                You need to be a {roleCheck} to access this page. 
                Please contact support if you believe this is an error.
              </p>
              <div className="flex gap-4">
                <a href="/dashboard" className="text-primary hover:underline">
                  Return to Dashboard
                </a>
              </div>
            </div>
          ) : (
            <Component />
          )
        )
      ) : (
        <Redirect to="/auth" />
      )}
    </Route>
  );
}
