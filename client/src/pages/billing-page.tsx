import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Payment, PaymentStatus } from "@shared/schema";

import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Receipt,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Calendar,
  Download,
  Filter,
  CreditCard,
  TrendingUp,
  AlertCircle,
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

export default function BillingPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments/user"],
  });

  const filteredPayments = statusFilter === "all"
    ? payments
    : payments.filter((p) => p.status === statusFilter);

  const totalPaid = payments
    .filter((p) => p.status === PaymentStatus.SUCCESS)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter((p) => p.status === PaymentStatus.PENDING)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalFailed = payments
    .filter((p) => p.status === PaymentStatus.FAILED)
    .reduce((sum, p) => sum + p.amount, 0);

  const successCount = payments.filter((p) => p.status === PaymentStatus.SUCCESS).length;

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
            View your payment history, transaction details, and billing summary.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="text-2xl font-bold text-green-600">{formatAmount(totalPaid)}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <ArrowUpCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{successCount} successful payment{successCount !== 1 ? "s" : ""}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{formatAmount(totalPending)}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Awaiting confirmation</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{formatAmount(totalFailed)}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Unsuccessful transactions</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-2xl font-bold">{payments.length}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">All time total</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Transaction History
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

            {payments.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
                    <div className="h-12 w-12 rounded-lg bg-green-600 flex items-center justify-center">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">M-Pesa (Safaricom)</p>
                      <p className="text-sm text-muted-foreground">
                        Payments are processed via Safaricom M-Pesa STK Push. You will receive a prompt on your phone to authorize each payment.
                      </p>
                    </div>
                  </div>
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