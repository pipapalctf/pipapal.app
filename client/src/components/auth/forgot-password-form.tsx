import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft } from 'lucide-react';

// Schema for password reset
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const { resetPasswordMutation } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  function onSubmit(values: ForgotPasswordFormValues) {
    resetPasswordMutation.mutate(
      { email: values.email },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
      }
    );
  }

  if (submitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h3 className="text-2xl font-medium text-secondary">Check Your Email</h3>
          <p className="text-sm text-muted-foreground">
            We've sent password reset instructions to your email address. Please check your inbox.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Didn't receive the email?
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => form.handleSubmit(onSubmit)()}
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Resend Email
          </Button>
        </div>
        <Button 
          type="button" 
          variant="link" 
          onClick={onBack}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-2xl font-medium text-secondary">Reset Your Password</h3>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your.email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col space-y-3">
            <Button
              type="submit"
              className="w-full"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Send Reset Instructions
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onBack}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}