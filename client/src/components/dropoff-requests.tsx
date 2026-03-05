import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Inbox, Star, Phone, Mail, Building2, Award, ChevronDown, ChevronUp, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { wasteTypeConfig } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

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
  const { user } = useAuth();
  const [expandedCollectors, setExpandedCollectors] = useState<Set<number>>(new Set());

  const isAccepting = user?.acceptingWaste !== false;

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

  const toggleAcceptingMutation = useMutation({
    mutationFn: async (acceptingWaste: boolean) => {
      const res = await apiRequest("PATCH", "/api/recycler/accepting-waste", { acceptingWaste });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: isAccepting ? "No Longer Accepting Waste" : "Now Accepting Waste",
        description: isAccepting
          ? "Collectors will no longer see you as an available drop-off option."
          : "Collectors can now select you for waste drop-offs.",
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

  const getWasteConfig = (type: string) => {
    return wasteTypeConfig[type as keyof typeof wasteTypeConfig] || wasteTypeConfig.general;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Incoming Drop-offs
            {dropoffs.length > 0 && (
              <Badge variant="secondary" className="ml-1">{dropoffs.length}</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Waste drop-offs assigned to you by collectors
          </p>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <div className="flex flex-col">
            <span className="text-sm font-medium">Accepting Waste</span>
            <span className="text-xs text-muted-foreground">
              {isAccepting ? "Visible to collectors" : "Hidden from collectors"}
            </span>
          </div>
          <Switch
            checked={isAccepting}
            onCheckedChange={(checked) => toggleAcceptingMutation.mutate(checked)}
            disabled={toggleAcceptingMutation.isPending}
          />
        </div>
      </div>

      {dropoffs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No drop-offs yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isAccepting
                ? "When collectors assign you for waste drop-off, they will appear here."
                : "Turn on \"Accepting Waste\" to start receiving drop-offs from collectors."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waste Type</TableHead>
                <TableHead>Collector</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Pickup Location</TableHead>
                <TableHead>Collection Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dropoffs.map((dropoff) => {
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
                      <TableCell>
                        <Badge variant="outline" className={
                          dropoff.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                          dropoff.status === "in_progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }>
                          {dropoff.status === "in_progress" ? "In Progress" :
                           dropoff.status === "completed" ? "Completed" :
                           dropoff.status === "confirmed" ? "Confirmed" : dropoff.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {isExpanded && dropoff.collectorDetails && (
                      <TableRow key={`${dropoff.id}-details`}>
                        <TableCell colSpan={6} className="p-2">
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
      )}
    </div>
  );
}
