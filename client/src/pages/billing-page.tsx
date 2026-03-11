import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Payment, PaymentStatus, Wallet, WalletTransaction, WalletTransactionType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Receipt,
  Wallet as WalletIcon,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Calendar,
  Filter,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Plus,
  Loader2,
  Smartphone,
} from "lucide-react";

function getStatusBadge(status: string) {
  switch (status) {
    case PaymentStatus.SUCCESS:
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>;
    case PaymentStatus.PENDING:
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    case PaymentStatus.FAILED:
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    case PaymentStatus.CANCELLED:
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100"><AlertCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDate(dateStr: string | Date | null | undefined) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(amount);
}

function TopUpDialog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");

  const topUpMutation = useMutation({
    mutationFn: async (data: { amount: number; phoneNumber: string }) => {
      const res = await apiRequest("POST", "/api/wallet/topup", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Top-up successful",
        description: data.message || `KSh ${amount} has been added to your wallet.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      setOpen(false);
      setAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Top-up failed",
        description: error.message || "Failed to process top-up. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 10) {
      toast({
        title: "Invalid amount",
        description: "Minimum top-up amount is KSh 10.",
        variant: "destructive",
      });
      return;
    }
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone required",
        description: "Please enter your M-Pesa phone number.",
        variant: "destructive",
      });
      return;
    }
    topUpMutation.mutate({ amount: parsedAmount, phoneNumber });
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Top Up
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            Top Up Wallet via M-Pesa
          </DialogTitle>
          <DialogDescription>
            Enter your M-Pesa phone number and amount to add funds to your wallet.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="phone">M-Pesa Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                placeholder="e.g. 0712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (KSh)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              min={10}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick amounts</Label>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((qa) => (
                <Button
                  key={qa}
                  type="button"
                  variant={amount === String(qa) ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setAmount(String(qa))}
                >
                  KSh {qa.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={topUpMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {topUpMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Smartphone className="h-4 w-4 mr-2" />
            )}
            {topUpMutation.isPending ? "Processing..." : `Top Up${amount ? ` KSh ${parseFloat(amount).toLocaleString()}` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BillingPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"wallet" | "payments">("wallet");

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments/user"],
  });

  const { data: wallet, isLoading: walletLoading } = useQuery<Wallet>({
    queryKey: ["/api/wallet"],
  });

  const { data: walletTransactions = [], isLoading: txLoading } = useQuery<WalletTransaction[]>({
    queryKey: ["/api/wallet/transactions"],
  });

  const isLoading = paymentsLoading || walletLoading;

  const filteredPayments = statusFilter === "all"
    ? payments
    : payments.filter((p) => p.status === statusFilter);

  const totalPaid = payments
    .filter((p) => p.status === PaymentStatus.SUCCESS)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter((p) => p.status === PaymentStatus.PENDING)
    .reduce((sum, p) => sum + p.amount, 0);

  const sortedPayments = [...filteredPayments].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Billing & Statements
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your wallet, view payment history and transaction details.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-44 rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-lg" />
          </div>
        ) : (
          <>
            <Card className="mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-green-100 text-sm font-medium flex items-center gap-1.5">
                      <WalletIcon className="h-4 w-4" />
                      PipaPal Wallet
                    </p>
                    <p className="text-4xl font-bold mt-1">
                      {formatAmount(wallet?.balance || 0)}
                    </p>
                    <p className="text-green-200 text-sm mt-1">Available balance</p>
                  </div>
                  <TopUpDialog />
                </div>
              </div>
              <CardContent className="pt-4 pb-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                    <p className="text-lg font-semibold text-green-600">{formatAmount(totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-lg font-semibold text-yellow-600">{formatAmount(totalPending)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Transactions</p>
                    <p className="text-lg font-semibold">{payments.length + walletTransactions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 mb-4">
              <Button
                variant={activeTab === "wallet" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("wallet")}
              >
                <WalletIcon className="h-4 w-4 mr-1.5" />
                Wallet Activity
              </Button>
              <Button
                variant={activeTab === "payments" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("payments")}
              >
                <CreditCard className="h-4 w-4 mr-1.5" />
                Payment History
              </Button>
            </div>

            {activeTab === "wallet" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <WalletIcon className="h-5 w-5" />
                    Wallet Transactions
                  </CardTitle>
                  <CardDescription>
                    Top-ups and payments made from your wallet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {txLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : walletTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <WalletIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground">No wallet activity yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Top up your wallet using M-Pesa to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {walletTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                            tx.type === WalletTransactionType.TOPUP
                              ? 'bg-green-100'
                              : tx.type === WalletTransactionType.EARNING
                              ? 'bg-emerald-100'
                              : tx.type === WalletTransactionType.REFUND
                              ? 'bg-blue-100'
                              : 'bg-orange-100'
                          }`}>
                            {tx.type === WalletTransactionType.TOPUP ? (
                              <ArrowDownCircle className="h-5 w-5 text-green-600" />
                            ) : tx.type === WalletTransactionType.EARNING ? (
                              <TrendingUp className="h-5 w-5 text-emerald-600" />
                            ) : tx.type === WalletTransactionType.REFUND ? (
                              <ArrowDownCircle className="h-5 w-5 text-blue-600" />
                            ) : (
                              <ArrowUpCircle className="h-5 w-5 text-orange-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium capitalize">{tx.type}</span>
                              {tx.referenceId && (
                                <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded hidden sm:inline">
                                  {tx.referenceId}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {tx.description || 'Wallet transaction'}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-sm font-semibold ${
                              tx.type === WalletTransactionType.PAYMENT
                                ? 'text-orange-600'
                                : 'text-green-600'
                            }`}>
                              {tx.type === WalletTransactionType.PAYMENT ? '-' : '+'}{formatAmount(tx.amount)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Bal: {formatAmount(tx.balanceAfter)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "payments" && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CreditCard className="h-5 w-5" />
                        M-Pesa Payment History
                      </CardTitle>
                      <CardDescription>
                        All your M-Pesa payments and their status
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Transactions</SelectItem>
                          <SelectItem value="success">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {sortedPayments.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground">No transactions found</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {statusFilter !== "all"
                          ? "Try changing the filter to see more transactions."
                          : "Your M-Pesa payment history will appear here once you make a payment."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="col-span-3">Date</div>
                        <div className="col-span-2">Amount</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Phone</div>
                        <div className="col-span-3">Receipt</div>
                      </div>
                      <Separator className="hidden md:block" />
                      {sortedPayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="md:col-span-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0 hidden md:block" />
                            <div>
                              <span className="text-sm">{formatDate(payment.createdAt)}</span>
                              {payment.collectionId && (
                                <p className="text-xs text-muted-foreground">Collection #{payment.collectionId}</p>
                              )}
                            </div>
                          </div>

                          <div className="md:col-span-2 flex items-center">
                            <span className="font-semibold text-sm">{formatAmount(payment.amount)}</span>
                          </div>

                          <div className="md:col-span-2 flex items-center">
                            {getStatusBadge(payment.status)}
                          </div>

                          <div className="md:col-span-2 flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span className="truncate">{payment.phoneNumber}</span>
                          </div>

                          <div className="md:col-span-3 flex items-center text-sm">
                            {payment.mpesaReceiptNumber ? (
                              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{payment.mpesaReceiptNumber}</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
      <Footer />
      <MobileNavigation />
    </div>
  );
}
