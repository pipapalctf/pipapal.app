import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon-badge";
import { Collection, WasteTypeValue, CollectionStatusType } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { EllipsisVertical, Eye, CalendarClock, X, Loader2, Plus, Smartphone } from "lucide-react";
import { collectionStatusConfig, wasteTypeConfig } from "@/lib/types";
import { format } from "date-fns";
import { Link, useLocation } from "wouter";
import PaymentDialog from "@/components/payment-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { CollectionStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function UpcomingCollections() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  const { data: collections, isLoading, error } = useQuery<Collection[]>({
    queryKey: ["/api/collections/upcoming"],
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/collections/${id}`, {
        status: CollectionStatus.CANCELLED
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Collection cancelled",
        description: "Your waste collection has been cancelled successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections/upcoming"] });
      setShowCancelDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel collection",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  function handleViewDetails(collection: Collection) {
    setSelectedCollection(collection);
    setShowDetailsDialog(true);
  }
  
  function handleReschedule(collection: Collection) {
    // Navigate to schedule pickup page with collection data for rescheduling
    navigate(`/schedule-pickup?edit=${collection.id}`);
  }
  
  function handleCancelRequest(collection: Collection) {
    setSelectedCollection(collection);
    setShowCancelDialog(true);
  }
  
  function confirmCancel() {
    if (selectedCollection) {
      cancelMutation.mutate(selectedCollection.id);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b border-gray-100">
          <CardTitle>Upcoming Collections</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="py-4 text-center text-red-500">
              Failed to load collections
            </div>
          ) : collections && collections.length > 0 ? (
            <>
              {collections.map((collection) => {
                const wasteConfig = wasteTypeConfig[collection.wasteType as WasteTypeValue] || wasteTypeConfig.general;
                const statusConfig = collectionStatusConfig[collection.status as CollectionStatusType];
                const formattedDate = format(
                  new Date(collection.scheduledDate),
                  "EEEE, d MMMM - h:mm a"
                );
                
                return (
                  <div 
                    key={collection.id} 
                    className="flex items-center justify-between py-4 border-b border-gray-100"
                  >
                    <div className="flex items-center">
                      <IconBadge 
                        icon={wasteConfig.icon} 
                        bgColor={wasteConfig.bgColor}
                        textColor={wasteConfig.textColor}
                      />
                      <div className="ml-4">
                        <h4 className="font-medium text-secondary">{wasteConfig.label}</h4>
                        <p className="text-sm text-gray-500">{formattedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span 
                        className={`px-3 py-1 text-xs rounded-full ${statusConfig.bgColor} ${statusConfig.textColor} font-medium`}
                      >
                        {statusConfig.label}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <EllipsisVertical className="h-4 w-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(collection)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReschedule(collection)}>
                            <CalendarClock className="mr-2 h-4 w-4" />
                            Reschedule
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={() => handleCancelRequest(collection)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No upcoming collections scheduled
            </div>
          )}

          <div className="mt-5 text-center">
            <Link href="/schedule-pickup">
              <Button variant="outline" className="bg-white">
                <Plus className="mr-2 h-4 w-4" />
                Schedule New Collection
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      {/* Collection Details Dialog */}
      {selectedCollection && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-start gap-4">
                <IconBadge 
                  icon={wasteTypeConfig[selectedCollection.wasteType as WasteTypeValue]?.icon || 'trash'} 
                  bgColor={wasteTypeConfig[selectedCollection.wasteType as WasteTypeValue]?.bgColor || 'bg-gray-100'}
                  textColor={wasteTypeConfig[selectedCollection.wasteType as WasteTypeValue]?.textColor || 'text-gray-900'}
                  size="lg"
                />
                <div>
                  <DialogTitle className="text-xl">
                    {wasteTypeConfig[selectedCollection.wasteType as WasteTypeValue]?.label || 'Unknown'} Collection
                  </DialogTitle>
                  <DialogDescription>
                    Scheduled for {format(new Date(selectedCollection.scheduledDate), "EEEE, MMMM d, yyyy")}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="rounded-lg bg-gray-50 p-3">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  collectionStatusConfig[selectedCollection.status as CollectionStatusType].bgColor
                } ${
                  collectionStatusConfig[selectedCollection.status as CollectionStatusType].textColor
                }`}>
                  {collectionStatusConfig[selectedCollection.status as CollectionStatusType].label}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-xs font-medium text-gray-500">Date</span>
                  <span className="font-medium">
                    {format(new Date(selectedCollection.scheduledDate), "MMMM d, yyyy")}
                  </span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-xs font-medium text-gray-500">Time</span>
                  <span className="font-medium">
                    {format(new Date(selectedCollection.scheduledDate), "h:mm a")}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-medium text-gray-500">Pickup Address</span>
                <span className="font-medium">{selectedCollection.address}</span>
              </div>
              
              {selectedCollection.notes && (
                <div className="flex flex-col space-y-1">
                  <span className="text-xs font-medium text-gray-500">Additional Notes</span>
                  <span className="font-medium">{selectedCollection.notes}</span>
                </div>
              )}
              
              {selectedCollection.collectorId && (
                <div className="flex flex-col space-y-1">
                  <span className="text-xs font-medium text-gray-500">Collector</span>
                  <span className="font-medium">ID: {selectedCollection.collectorId}</span>
                </div>
              )}
              
              {/* Timeline */}
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Status Timeline</h4>
                <div className="space-y-2">
                  <div className="relative pl-6 border-l-2 border-primary pb-4">
                    <div className="absolute left-[-5px] top-0 h-3 w-3 rounded-full bg-primary"></div>
                    <p className="text-sm font-medium">Collection Scheduled</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(selectedCollection.createdAt || selectedCollection.scheduledDate), "MMM d, yyyy - h:mm a")}
                    </p>
                  </div>
                  
                  {selectedCollection.status !== 'pending' && (
                    <div className="relative pl-6 border-l-2 border-primary pb-4">
                      <div className="absolute left-[-5px] top-0 h-3 w-3 rounded-full bg-primary"></div>
                      <p className="text-sm font-medium">Status Updated</p>
                      <p className="text-xs text-gray-500">
                        {collectionStatusConfig[selectedCollection.status as CollectionStatusType].label}
                      </p>
                    </div>
                  )}
                  
                  {selectedCollection.status === 'completed' && selectedCollection.completedDate && (
                    <div className="relative pl-6">
                      <div className="absolute left-[-5px] top-0 h-3 w-3 rounded-full bg-primary"></div>
                      <p className="text-sm font-medium">Collection Completed</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(selectedCollection.completedDate), "MMM d, yyyy - h:mm a")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {selectedCollection.status !== 'cancelled' && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Payment</h4>
                <PaymentDialog
                  collectionId={selectedCollection.id}
                  suggestedAmount={selectedCollection.wasteAmount ? Math.round(selectedCollection.wasteAmount * 50) : 500}
                  trigger={
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <Smartphone className="mr-2 h-4 w-4" />
                      Pay with M-Pesa
                    </Button>
                  }
                />
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Close
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowDetailsDialog(false);
                  handleReschedule(selectedCollection);
                }}
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                Reschedule
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  setShowDetailsDialog(false);
                  handleCancelRequest(selectedCollection);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Cancel Confirmation Dialog */}
      {selectedCollection && (
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Cancel Collection</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this waste collection? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <IconBadge 
                    icon={wasteTypeConfig[selectedCollection.wasteType as WasteTypeValue]?.icon || 'trash'} 
                    bgColor={wasteTypeConfig[selectedCollection.wasteType as WasteTypeValue]?.bgColor || 'bg-gray-100'}
                    textColor={wasteTypeConfig[selectedCollection.wasteType as WasteTypeValue]?.textColor || 'text-gray-900'}
                    size="sm"
                  />
                  <span className="ml-2 font-medium">
                    {wasteTypeConfig[selectedCollection.wasteType as WasteTypeValue]?.label || 'Unknown'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {format(new Date(selectedCollection.scheduledDate), "EEEE, d MMMM - h:mm a")}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Keep It
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmCancel}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Cancel Collection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}