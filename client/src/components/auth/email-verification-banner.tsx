import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { MailCheck, AlertCircle, Loader2 } from "lucide-react";

export function EmailVerificationBanner() {
  const { 
    firebaseUser, 
    isEmailVerified,
    resendVerificationEmailMutation
  } = useAuth();
  
  // Only show for logged in users who haven't verified their email
  if (!firebaseUser || isEmailVerified) {
    return null;
  }
  
  const handleResendEmail = () => {
    resendVerificationEmailMutation.mutate();
  };
  
  return (
    <Alert className="my-4 border-amber-500 bg-amber-50 dark:bg-amber-950 dark:border-amber-500">
      <AlertCircle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-700 dark:text-amber-300">
        Verify your email address
      </AlertTitle>
      <AlertDescription className="flex flex-col space-y-2 text-amber-700 dark:text-amber-300">
        <p>
          We've sent a verification email to <strong>{firebaseUser.email}</strong>.
          Please check your inbox and click the verification link to continue.
        </p>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResendEmail}
            disabled={resendVerificationEmailMutation.isPending}
            className="border-amber-500 hover:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900"
          >
            {resendVerificationEmailMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MailCheck className="mr-2 h-4 w-4" />
                Resend verification email
              </>
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}