import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertTriangle, Mail } from "lucide-react";
import { Redirect, Route } from "wouter";
import { UserRoleType } from "@shared/schema";
import { Button } from "@/components/ui/button";

export function ProtectedRoute({
  path,
  component: Component,
  roleCheck,
  skipOnboardingCheck = false, // Added parameter to optionally skip onboarding check
  requireEmailVerification = false, // Add option to require email verification
}: {
  path: string;
  component: () => React.JSX.Element;
  roleCheck?: UserRoleType;
  skipOnboardingCheck?: boolean; // For routes like onboarding itself
  requireEmailVerification?: boolean; // If true, user must have verified email
}) {
  const { user, isLoading, isEmailVerified, resendVerificationEmailMutation } = useAuth();

  const handleResendVerification = () => {
    resendVerificationEmailMutation.mutate();
  };

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
          // If email verification is required, check if email is verified
          requireEmailVerification && !isEmailVerified ? (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
              <Mail className="h-12 w-12 text-amber-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Email Verification Required</h1>
              <p className="text-muted-foreground mb-6 max-w-md">
                Please verify your email address to access this feature.
                Check your inbox for a verification link from PipaPal.
              </p>
              <div className="flex flex-col gap-4 items-center">
                <Button 
                  onClick={handleResendVerification} 
                  disabled={resendVerificationEmailMutation.isPending}
                  className="min-w-40"
                >
                  {resendVerificationEmailMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Verification Email"
                  )}
                </Button>
                <a href="/dashboard" className="text-primary hover:underline mt-4">
                  Return to Dashboard
                </a>
              </div>
            </div>
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
        )
      ) : (
        <Redirect to="/auth" />
      )}
    </Route>
  );
}
