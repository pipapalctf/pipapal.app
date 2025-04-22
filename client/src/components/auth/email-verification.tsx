import { useState, useEffect } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Loader2, MailCheck, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// OTP verification form schema
const verificationSchema = z.object({
  otp: z.string().length(6, {
    message: "Verification code must be 6 digits",
  }),
});

type OtpData = z.infer<typeof verificationSchema>;

interface EmailVerificationProps {
  email: string;
  isLoading: boolean;
  onVerify: (data: OtpData) => Promise<void>;
  onResend: () => Promise<void>;
  devOtpCode: string | null;
}

export function EmailVerification({
  email,
  isLoading,
  onVerify,
  onResend,
  devOtpCode,
}: EmailVerificationProps) {
  const { toast } = useToast();
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Form for OTP
  const form = useForm<OtpData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      otp: "",
    },
  });

  // Auto-fill code in development mode
  useEffect(() => {
    if (devOtpCode) {
      form.setValue('otp', devOtpCode);
      
      toast({
        title: "Development Mode",
        description: `Verification code auto-filled: ${devOtpCode}`,
      });
    }
  }, [devOtpCode, form, toast]);

  // Countdown for resend button
  useEffect(() => {
    if (resendDisabled && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setResendDisabled(false);
    }
  }, [resendDisabled, countdown]);

  // Handle resend verification email
  const handleResend = async () => {
    try {
      setResendDisabled(true);
      setCountdown(30);
      await onResend();
      
      toast({
        title: "Verification email resent",
        description: "Please check your email for a new verification code",
      });
    } catch (error) {
      setResendDisabled(false);
      toast({
        title: "Failed to resend",
        description: "Could not send a new verification code. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <MailCheck size={40} className="mx-auto mb-2 text-primary" />
        <h3 className="text-lg font-medium">Check your email</h3>
        <p className="text-sm text-muted-foreground mt-1">
          We've sent a 6-digit verification code to <span className="font-medium">{email}</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onVerify)} className="space-y-6">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem className="mx-auto max-w-[250px]">
                <FormLabel className="text-center block">Verification Code</FormLabel>
                <FormControl>
                  <InputOTP maxLength={6} {...field}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Email
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={resendDisabled || isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${resendDisabled ? 'animate-spin' : ''}`} />
              {resendDisabled
                ? `Resend in ${countdown}s`
                : "Resend Verification Code"}
            </Button>
          </div>
        </form>
      </Form>

      {devOtpCode && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-700">
            <strong>Development Mode:</strong> Use code <code className="bg-yellow-100 px-1 rounded">{devOtpCode}</code>
          </p>
        </div>
      )}
    </div>
  );
}

export default EmailVerification;