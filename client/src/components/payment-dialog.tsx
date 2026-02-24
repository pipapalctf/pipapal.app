import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Payment } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, CheckCircle, XCircle, Clock, Smartphone } from "lucide-react";

interface PaymentDialogProps {
  collectionId: number;
  suggestedAmount?: number;
  trigger: React.ReactNode;
}

export default function PaymentDialog({ collectionId, suggestedAmount, trigger }: PaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState(suggestedAmount?.toString() || "");
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: existingPayments, refetch } = useQuery<Payment[]>({
    queryKey: [`/api/payments/collection/${collectionId}`],
    enabled: open,
    refetchInterval: paymentInitiated ? 5000 : false,
  });

  const successfulPayment = existingPayments?.find(p => p.status === 'success');
  const pendingPayment = existingPayments?.find(p => p.status === 'pending');
  const failedPayment = existingPayments?.find(p => p.status === 'failed' || p.status === 'cancelled');

  useEffect(() => {
    if (paymentInitiated && (successfulPayment || failedPayment)) {
      setPaymentInitiated(false);
      if (successfulPayment) {
        toast({ title: "Payment successful", description: `KES ${successfulPayment.amount} paid via M-Pesa.` });
      } else if (failedPayment) {
        toast({
          title: "Payment not completed",
          description: failedPayment.resultDesc || "The payment was not completed.",
          variant: "destructive",
        });
      }
    }
  }, [successfulPayment, failedPayment, paymentInitiated]);

  const stkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/stk-push", {
        collectionId,
        amount: parseFloat(amount),
        phoneNumber,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Payment failed" }));
        throw new Error(data.error || "Failed to initiate payment");
      }
      return res.json();
    },
    onSuccess: () => {
      setPaymentInitiated(true);
      toast({
        title: "Payment request sent",
        description: "Check your phone for the M-Pesa prompt and enter your PIN.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/payments/collection/${collectionId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !amount) return;
    stkMutation.mutate();
  };

  const resetForm = () => {
    setPaymentInitiated(false);
    setPhoneNumber("");
    setAmount(suggestedAmount?.toString() || "");
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            M-Pesa Payment
          </DialogTitle>
          <DialogDescription>
            Pay for your waste collection via M-Pesa
          </DialogDescription>
        </DialogHeader>

        {successfulPayment ? (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">Payment Complete</h3>
            <p className="text-muted-foreground mt-1">
              KES {successfulPayment.amount} paid successfully
            </p>
            {successfulPayment.mpesaReceiptNumber && (
              <p className="text-sm text-muted-foreground mt-2">
                Receipt: {successfulPayment.mpesaReceiptNumber}
              </p>
            )}
          </div>
        ) : paymentInitiated ? (
          <div className="text-center py-6">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <Clock className="h-16 w-16 text-yellow-500 animate-pulse" />
            </div>
            <h3 className="font-semibold text-lg">Waiting for Payment</h3>
            <p className="text-muted-foreground mt-1">
              Check your phone for the M-Pesa prompt
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your M-Pesa PIN to complete the payment
            </p>
            <div className="mt-6 flex gap-3 justify-center">
              <Button variant="outline" onClick={() => refetch()}>
                Check Status
              </Button>
              <Button variant="ghost" onClick={resetForm}>
                Try Again
              </Button>
            </div>
          </div>
        ) : failedPayment && !pendingPayment ? (
          <div className="text-center py-6">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-semibold text-lg">Payment Not Completed</h3>
            <p className="text-muted-foreground mt-1">
              {failedPayment.resultDesc || "The payment was cancelled or failed."}
            </p>
            <Button className="mt-4 bg-green-600 hover:bg-green-700" onClick={resetForm}>
              Try Again
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Safaricom number registered for M-Pesa
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                You will receive a prompt on your phone to enter your M-Pesa PIN to confirm the payment.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={stkMutation.isPending || !phoneNumber || !amount}
            >
              {stkMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending payment request...
                </>
              ) : (
                <>
                  <Smartphone className="mr-2 h-4 w-4" />
                  Pay KES {amount || '0'} via M-Pesa
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
