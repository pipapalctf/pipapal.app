import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Truck, MapPin, Package, Calendar, Scale, Building2, Inbox } from "lucide-react";
import { format } from "date-fns";
import { wasteTypeConfig } from "@/lib/types";

interface DropoffCollection {
  id: number;
  wasteType: string;
  wasteAmount: number | null;
  status: string;
  scheduledDate: string;
  address: string;
  city: string | null;
  dropoffCenterId: number;
  dropoffStatus: string | null;
  collectorName: string | null;
  householdName: string | null;
  dropoffCenter: {
    id: number;
    name: string;
    address: string;
    city: string;
  } | null;
}

export function DropoffRequests() {
  const { toast } = useToast();

  const { data: dropoffs = [], isLoading } = useQuery<DropoffCollection[]>({
    queryKey: ["/api/dropoffs"],
    refetchInterval: 30000,
  });

  const updateDropoffMutation = useMutation({
    mutationFn: async ({ collectionId, dropoffStatus }: { collectionId: number; dropoffStatus: "accepted" | "rejected" }) => {
      const res = await apiRequest("PATCH", `/api/collections/${collectionId}/dropoff-status`, { dropoffStatus });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update drop-off status");
      }
      return res.json();
    },
    onSuccess: (_, { dropoffStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dropoffs"] });
      toast({
        title: dropoffStatus === "accepted" ? "Drop-off Accepted" : "Drop-off Rejected",
        description: dropoffStatus === "accepted"
          ? "The collector has been notified that their drop-off is accepted."
          : "The collector has been notified to choose another center.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingDropoffs = dropoffs.filter((d) => d.dropoffStatus === "pending");
  const processedDropoffs = dropoffs.filter((d) => d.dropoffStatus !== "pending");

  const getWasteConfig = (type: string) => {
    return wasteTypeConfig[type as keyof typeof wasteTypeConfig] || wasteTypeConfig.general;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Accepted</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading drop-off requests...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          Incoming Drop-off Requests
          {pendingDropoffs.length > 0 && (
            <Badge className="ml-1">{pendingDropoffs.length} pending</Badge>
          )}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review and manage waste drop-off requests from collectors
        </p>
      </div>

      {pendingDropoffs.length === 0 && processedDropoffs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No drop-off requests yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              When collectors assign your center for waste drop-off, requests will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {pendingDropoffs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Pending Review</h3>
              {pendingDropoffs.map((dropoff) => {
                const config = getWasteConfig(dropoff.wasteType);
                return (
                  <Card key={dropoff.id} className="border-yellow-200 bg-yellow-50/30">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${config.bgColor} ${config.textColor} border-0`}>
                              {config.label}
                            </Badge>
                            {getStatusBadge(dropoff.dropoffStatus)}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Truck className="h-3.5 w-3.5 shrink-0" />
                              <span>Collector: <span className="text-foreground font-medium">{dropoff.collectorName || "Unknown"}</span></span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Scale className="h-3.5 w-3.5 shrink-0" />
                              <span>{dropoff.wasteAmount ? `${dropoff.wasteAmount} kg` : "Amount TBD"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{dropoff.address}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <span>{dropoff.scheduledDate ? format(new Date(dropoff.scheduledDate), "MMM d, yyyy") : "N/A"}</span>
                            </div>
                          </div>
                          {dropoff.dropoffCenter && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Building2 className="h-3.5 w-3.5 shrink-0" />
                              <span>Center: <span className="text-foreground">{dropoff.dropoffCenter.name}</span></span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 sm:flex-col">
                          <Button
                            size="sm"
                            onClick={() => updateDropoffMutation.mutate({ collectionId: dropoff.id, dropoffStatus: "accepted" })}
                            disabled={updateDropoffMutation.isPending}
                            className="flex-1 sm:flex-none"
                          >
                            {updateDropoffMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="mr-1.5 h-4 w-4" />
                                Accept
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateDropoffMutation.mutate({ collectionId: dropoff.id, dropoffStatus: "rejected" })}
                            disabled={updateDropoffMutation.isPending}
                            className="flex-1 sm:flex-none"
                          >
                            {updateDropoffMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="mr-1.5 h-4 w-4" />
                                Reject
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {processedDropoffs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Processed</h3>
              {processedDropoffs.slice(0, 10).map((dropoff) => {
                const config = getWasteConfig(dropoff.wasteType);
                return (
                  <Card key={dropoff.id} className="bg-muted/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Badge className={`${config.bgColor} ${config.textColor} border-0 shrink-0`}>
                            {config.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground truncate">
                            {dropoff.collectorName || "Unknown collector"} — {dropoff.wasteAmount ? `${dropoff.wasteAmount} kg` : "Amount TBD"}
                          </span>
                        </div>
                        {getStatusBadge(dropoff.dropoffStatus)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
