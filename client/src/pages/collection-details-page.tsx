import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Collection, WasteType, CollectionStatus, WasteTypeValue, CollectionStatusType } from "@shared/schema";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { wasteTypeConfig, collectionStatusConfig } from "@/lib/types";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Clipboard, 
  Loader2, 
  CalendarClock, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconBadge } from "@/components/ui/icon-badge";

export default function CollectionDetailsPage() {
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const collectionId = parseInt(params.id);
  
  const { data: collection, isLoading, error } = useQuery<Collection>({
    queryKey: ['/api/collections', collectionId],
    enabled: !isNaN(collectionId),
  });
  
  // Redirect if collection not found after loading completes
  useEffect(() => {
    if (!isLoading && !collection && !error) {
      navigate("/");
    }
  }, [isLoading, collection, error, navigate]);
  
  if (isLoading || !collection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-center text-muted-foreground">Loading collection...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-500">Error</h2>
              <p className="mt-2">Failed to load collection details</p>
              <Button onClick={() => navigate("/")} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const wasteConfig = wasteTypeConfig[collection.wasteType as WasteTypeValue] || wasteTypeConfig.general;
  const statusConfig = collectionStatusConfig[collection.status as CollectionStatusType];
  const formattedDate = format(new Date(collection.scheduledDate), "EEEE, MMMM d, yyyy");
  const formattedTime = format(new Date(collection.scheduledDate), "h:mm a");

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <CardTitle className="text-xl">Collection Details</CardTitle>
              <Badge
                className={`${statusConfig.bgColor} ${statusConfig.textColor} px-3 py-1 text-xs font-medium`}
              >
                {statusConfig.label}
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="flex items-center mb-6">
                    <IconBadge 
                      icon={wasteConfig.icon} 
                      bgColor={wasteConfig.bgColor}
                      textColor={wasteConfig.textColor}
                      size="lg"
                    />
                    <div className="ml-4">
                      <h3 className="text-xl font-semibold">{wasteConfig.label}</h3>
                      <p className="text-muted-foreground">Waste Type</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex">
                      <Calendar className="h-5 w-5 mr-2 text-primary" />
                      <div>
                        <p className="font-medium">{formattedDate}</p>
                        <p className="text-sm text-muted-foreground">Scheduled Date</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <Clock className="h-5 w-5 mr-2 text-primary" />
                      <div>
                        <p className="font-medium">{formattedTime}</p>
                        <p className="text-sm text-muted-foreground">Pickup Time</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex">
                    <MapPin className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <p className="font-medium">{collection.address}</p>
                      <p className="text-sm text-muted-foreground">Pickup Address</p>
                    </div>
                  </div>
                  
                  {collection.notes && (
                    <div className="flex">
                      <Clipboard className="h-5 w-5 mr-2 text-primary" />
                      <div>
                        <p className="font-medium">{collection.notes}</p>
                        <p className="text-sm text-muted-foreground">Additional Notes</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6 flex gap-3">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/schedule-pickup?edit=${collection.id}`)}
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              Reschedule
            </Button>
            <Button 
              variant="destructive"
              className="flex-1"
              onClick={() => {
                // Show cancel confirmation dialog
                if (confirm("Are you sure you want to cancel this collection?")) {
                  fetch(`/api/collections/${collection.id}`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: 'cancelled' }),
                  }).then(() => {
                    navigate("/");
                  });
                }
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Collection
            </Button>
          </div>
        </div>
        
        <div>
          <Card>
            <CardHeader className="border-b border-gray-100">
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="relative pl-6 border-l-2 border-primary pb-6">
                  <div className="absolute left-[-8px] top-0 h-4 w-4 rounded-full bg-primary"></div>
                  <h4 className="font-medium">Collection Scheduled</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(collection.createdAt || collection.scheduledDate), "MMM d, yyyy - h:mm a")}
                  </p>
                </div>
                
                {collection.status !== 'pending' && (
                  <div className="relative pl-6 border-l-2 border-primary pb-6">
                    <div className="absolute left-[-8px] top-0 h-4 w-4 rounded-full bg-primary"></div>
                    <h4 className="font-medium">Status Updated</h4>
                    <p className="text-sm text-muted-foreground">{statusConfig.label}</p>
                  </div>
                )}
                
                {collection.status === 'completed' && collection.completedDate && (
                  <div className="relative pl-6">
                    <div className="absolute left-[-8px] top-0 h-4 w-4 rounded-full bg-primary"></div>
                    <h4 className="font-medium">Collection Completed</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(collection.completedDate), "MMM d, yyyy - h:mm a")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}