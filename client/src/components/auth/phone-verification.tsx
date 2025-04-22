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

const phoneVerificationSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .max(15, { message: "Phone number is too long" })
    .regex(/^\+?[0-9]+$/, { message: "Please enter a valid phone number" }),
});

const otpVerificationSchema = z.object({
  otp: z
    .string()
    .length(6, { message: "OTP must be 6 digits" })
    .regex(/^[0-9]+$/, { message: "OTP must contain only numbers" }),
});

type PhoneVerificationSchemaType = z.infer<typeof phoneVerificationSchema>;
type OtpVerificationSchemaType = z.infer<typeof otpVerificationSchema>;

export function PhoneVerification() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationComplete, setVerificationComplete] = useState(false);
  
  const phoneForm = useForm<PhoneVerificationSchemaType>({
    resolver: zodResolver(phoneVerificationSchema),
    defaultValues: {
      phoneNumber: user?.phone || "",
    },
  });

  const otpForm = useForm<OtpVerificationSchemaType>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      otp: "",
    },
  });

  const sendVerificationCode = async (data: PhoneVerificationSchemaType) => {
    setLoading(true);
    setPhoneNumber(data.phoneNumber);
    
    try {
      const response = await apiRequest("POST", "/api/otp/send", {
        phoneNumber: data.phoneNumber,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send verification code");
      }
      
      toast({
        title: "Verification code sent",
        description: "Please check your phone for a 6-digit verification code",
      });
      
      setStep("otp");
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

  const verifyOtp = async (data: OtpVerificationSchemaType) => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/otp/verify", {
        phoneNumber,
        otp: data.otp,
        userId: user.id,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to verify code");
      }
      
      toast({
        title: "Success!",
        description: "Your phone number has been verified",
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
            Your phone number has been successfully verified.
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
        <CardTitle>Phone Verification</CardTitle>
        <CardDescription>
          Verify your phone number for additional security
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "phone" ? (
          <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(sendVerificationCode)} className="space-y-4">
              <FormField
                control={phoneForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+2547XXXXXXXX" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your phone number with country code
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
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(verifyOtp)} className="space-y-4">
              <FormField
                control={otpForm.control}
                name="otp"
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
                      Enter the 6-digit code sent to {phoneNumber}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setStep("phone")}
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
          We'll only use your phone number for account verification and important notifications about your waste collections.
        </p>
      </CardFooter>
    </Card>
  );
}