import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle2 } from "lucide-react";

const emailVerificationSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address" }),
});

const codeVerificationSchema = z.object({
  code: z
    .string()
    .length(6, { message: "Verification code must be 6 digits" })
    .regex(/^[0-9]+$/, { message: "Verification code must contain only numbers" }),
});

type EmailVerificationSchemaType = z.infer<typeof emailVerificationSchema>;
type CodeVerificationSchemaType = z.infer<typeof codeVerificationSchema>;

export function EmailVerification() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [verificationComplete, setVerificationComplete] = useState(false);
  
  const emailForm = useForm<EmailVerificationSchemaType>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });

  const codeForm = useForm<CodeVerificationSchemaType>({
    resolver: zodResolver(codeVerificationSchema),
    defaultValues: {
      code: "",
    },
  });

  const [devVerificationCode, setDevVerificationCode] = useState<string | null>(null);
  
  const sendVerificationCode = async (data: EmailVerificationSchemaType) => {
    setLoading(true);
    setEmail(data.email);
    setDevVerificationCode(null); // Reset any previous dev code
    
    try {
      const response = await apiRequest("POST", "/api/email/send", {
        email: data.email,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send verification code");
      }
      
      // Get the response data
      const responseData = await response.json();
      
      // Check if we're in development mode and a code was provided
      if (responseData.developmentMode && responseData.code) {
        setDevVerificationCode(responseData.code);
        toast({
          title: "Test Mode",
          description: "A verification code has been generated for testing",
        });
      } else {
        // Standard notification for production mode
        toast({
          title: "Verification code sent",
          description: "Please check your email for a 6-digit verification code",
        });
      }
      
      setStep("code");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (data: CodeVerificationSchemaType) => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/email/verify", {
        email,
        code: data.code,
        userId: user.id,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to verify code");
      }
      
      toast({
        title: "Success!",
        description: "Your email has been verified",
      });
      
      setVerificationComplete(true);
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verificationComplete) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-green-600">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
            Verification Complete
          </CardTitle>
          <CardDescription className="text-center">
            Your email has been successfully verified.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={() => {
            // Refresh the page or redirect to profile
            window.location.reload();
          }}>
            Return to Profile
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>
          Verify your email address for additional security
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "email" ? (
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(sendVerificationCode)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="your@email.com" 
                        type="email"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the email address you want to verify
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send Verification Code
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...codeForm}>
            <form onSubmit={codeForm.handleSubmit(verifyCode)} className="space-y-4">
              <FormField
                control={codeForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="6-digit code" 
                        maxLength={6}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the 6-digit code sent to {email}
                      {devVerificationCode && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-blue-800 font-medium text-xs">
                            Test Mode: Use code <span className="font-bold">{devVerificationCode}</span>
                          </p>
                        </div>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setStep("email")}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify Code
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="text-xs text-center text-muted-foreground">
        <p className="w-full">
          We'll only use your email for account verification and important notifications about your waste collections.
        </p>
      </CardFooter>
    </Card>
  );
}