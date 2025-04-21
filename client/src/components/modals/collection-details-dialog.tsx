import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import { Collection, User } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { wasteTypeConfig } from '@/lib/types';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  CircleDollarSign, 
  PackageOpen, 
  FileText, 
  User as UserIcon,
  Phone,
  Mail,
  Scale,
  CheckCircle2
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface CollectionDetailsDialogProps {
  collectionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CollectionDetailsDialog({ 
  collectionId, 
  open, 
  onOpenChange 
}: CollectionDetailsDialogProps) {
  // Fetch collection details when dialog is open and we have a valid ID
  const { data: collection, isLoading: isLoadingCollection } = useQuery<Collection>({
    queryKey: ['/api/collections', collectionId],
    enabled: open && !!collectionId,
  });

  // Fetch collector details if we have a collector ID
  const { data: collector, isLoading: isLoadingCollector } = useQuery<User>({
    queryKey: ['/api/users', collection?.collectorId],
    enabled: open && !!collection?.collectorId,
  });

  // Get waste type configuration for styling
  const getWasteTypeConfig = (type?: string) => {
    if (!type) return wasteTypeConfig.general;
    return wasteTypeConfig[type as keyof typeof wasteTypeConfig] || wasteTypeConfig.general;
  };

  // Format date for display
  const formatDate = (date?: string | Date | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {isLoadingCollection ? (
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : !collection ? (
          <DialogHeader>
            <DialogTitle>Collection not found</DialogTitle>
            <DialogDescription>
              The requested collection could not be found or you don't have permission to view it.
            </DialogDescription>
          </DialogHeader>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <DialogTitle>Material Details</DialogTitle>
                <Badge 
                  variant="outline" 
                  className={
                    collection.status === 'completed' 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }
                >
                  {collection.status === 'completed' ? (
                    <><CheckCircle2 className="h-3 w-3 mr-1" />Completed</>
                  ) : (
                    <><Clock className="h-3 w-3 mr-1" />In Progress</>
                  )}
                </Badge>
              </div>
              
              <DialogDescription>
                Detailed information about this collection and materials
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4">
              {/* Waste Information */}
              <div className="grid gap-2">
                <h3 className="text-sm font-medium">Material Details</h3>
                <div className="bg-muted/50 p-3 rounded-md grid gap-2">
                  <div className="flex items-center">
                    <PackageOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground mr-1">Type:</span>
                    <Badge 
                      variant="outline" 
                      className={`text-${getWasteTypeConfig(collection.wasteType).color} bg-${getWasteTypeConfig(collection.wasteType).color}/10`}
                    >
                      {getWasteTypeConfig(collection.wasteType).label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center">
                    <Scale className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground mr-1">Amount:</span>
                    <span className="text-sm font-medium">{collection.wasteAmount ? `${formatNumber(collection.wasteAmount)} kg` : 'Not recorded'}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <CircleDollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground mr-1">Est. Value:</span>
                    <span className="text-sm font-medium">${formatNumber((collection.wasteAmount || 0) * 0.2, 2)}</span>
                  </div>
                  
                  {collection.wasteDescription && (
                    <div className="flex">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0 mt-1" />
                      <div>
                        <span className="text-sm text-muted-foreground">Description:</span>
                        <p className="text-sm">{collection.wasteDescription}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Location Information */}
              <div className="grid gap-2">
                <h3 className="text-sm font-medium">Location Details</h3>
                <div className="bg-muted/50 p-3 rounded-md grid gap-2">
                  <div className="flex">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0 mt-1" />
                    <div>
                      <span className="text-sm text-muted-foreground">Address:</span>
                      <p className="text-sm">{collection.address}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Timing Information */}
              <div className="grid gap-2">
                <h3 className="text-sm font-medium">Collection Dates</h3>
                <div className="bg-muted/50 p-3 rounded-md grid gap-2">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground mr-1">Scheduled:</span>
                    <span className="text-sm">{formatDate(collection.scheduledDate)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground mr-1">Completed:</span>
                    <span className="text-sm">{collection.completedDate ? formatDate(collection.completedDate) : 'Not completed yet'}</span>
                  </div>
                </div>
              </div>
              
              {/* Collector Information */}
              {collection.collectorId && (
                <div className="grid gap-2">
                  <h3 className="text-sm font-medium">Collector Information</h3>
                  <div className="bg-muted/50 p-3 rounded-md grid gap-2">
                    {isLoadingCollector ? (
                      <div className="flex items-center justify-center p-2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span className="text-sm ml-2">Loading collector details...</span>
                      </div>
                    ) : !collector ? (
                      <span className="text-sm text-muted-foreground">Collector information not available</span>
                    ) : (
                      <>
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground mr-1">Name:</span>
                          <span className="text-sm font-medium">{collector.fullName}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground mr-1">Phone:</span>
                          <span className="text-sm">{collector.phone || 'Not provided'}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground mr-1">Email:</span>
                          <span className="text-sm">{collector.email}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Notes */}
              {collection.notes && (
                <div className="grid gap-2">
                  <h3 className="text-sm font-medium">Notes</h3>
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm">{collection.notes}</p>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}