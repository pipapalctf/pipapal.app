import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle, XCircle, Inbox, Star, Phone, Mail, Building2, Award, ChevronDown, ChevronUp, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { wasteTypeConfig } from "@/lib/types";

interface CollectorDetails {
  email: string;
  phone: string | null;
  businessName: string | null;
  serviceLocation: string | null;
  isCertified: boolean;
  rating: number;
  ratingCount: number;
}

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
  recyclerName: string | null;
  collectorDetails: CollectorDetails | null;
}

function CollectorDetailsPanel({ details, collectorName }: { details: CollectorDetails; collectorName: string | null }) {
  return (
    <div className="py-2 px-3 bg-muted/30 rounded-lg space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <User className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">{collectorName || "Collector"}</span>
        {details.isCertified && (
          <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
            <Award className="h-3 w-3 mr-0.5" />
            Certified
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {details.businessName && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span>{details.businessName}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Star className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
          {details.ratingCount > 0 ? (
            <span>
              <span className="text-foreground font-medium">{details.rating}</span>/5
              <span className="text-xs ml-1">({details.ratingCount} {details.ratingCount === 1 ? "review" : "reviews"})</span>
            </span>
          ) : (
            <span className="text-xs">No ratings yet</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Mail className="h-3.5 w-3.5 shrink-0 text-primary/70" />
          <a href={`mailto:${details.email}`} className="text-primary hover:underline truncate">{details.email}</a>
        </div>
        {details.phone && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <a href={`tel:${details.phone}`} className="text-primary hover:underline">{details.phone}</a>
          </div>
        )}
        {details.serviceLocation && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span>Serves: {details.serviceLocation}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function DropoffRequests() {
  const { toast } = useToast();
  const [expandedCollectors, setExpandedCollectors] = useState<Set<number>>(new Set());

  const toggleCollectorDetails = (id: number) => {
    setExpandedCollectors(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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

  const renderTable = (items: DropoffCollection[], showActions: boolean) => (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Waste Type</TableHead>
            <TableHead>Collector</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((dropoff) => {
            const config = getWasteConfig(dropoff.wasteType);
            const isExpanded = expandedCollectors.has(dropoff.id);
            return (
              <>
                <TableRow key={dropoff.id}>
                  <TableCell>
                    <Badge className={`${config.bgColor} ${config.textColor} border-0`}>
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{dropoff.collectorName || "Unknown"}</span>
                      {dropoff.collectorDetails && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80 p-0 h-auto font-normal text-xs justify-start"
                          onClick={() => toggleCollectorDetails(dropoff.id)}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              View Details
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{dropoff.wasteAmount ? `${dropoff.wasteAmount} kg` : "TBD"}</TableCell>
                  <TableCell>
                    <span className="text-sm truncate max-w-[200px] block">{dropoff.address}</span>
                  </TableCell>
                  <TableCell>
                    {dropoff.scheduledDate ? format(new Date(dropoff.scheduledDate), "MMM d, yyyy") : "N/A"}
                  </TableCell>
                  <TableCell>{getStatusBadge(dropoff.dropoffStatus)}</TableCell>
                  {showActions && (
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => updateDropoffMutation.mutate({ collectionId: dropoff.id, dropoffStatus: "accepted" })}
                          disabled={updateDropoffMutation.isPending}
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
                    </TableCell>
                  )}
                </TableRow>
                {isExpanded && dropoff.collectorDetails && (
                  <TableRow key={`${dropoff.id}-details`}>
                    <TableCell colSpan={showActions ? 7 : 6} className="p-2">
                      <CollectorDetailsPanel details={dropoff.collectorDetails} collectorName={dropoff.collectorName} />
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

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
              {renderTable(pendingDropoffs, true)}
            </div>
          )}

          {processedDropoffs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Processed</h3>
              {renderTable(processedDropoffs.slice(0, 10), false)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
