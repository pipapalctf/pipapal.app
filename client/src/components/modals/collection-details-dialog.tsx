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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collection, User, UserRole, wastePricingConfig, getCustomerCostEstimate, getCollectorEarnings, PricingCategory } from '@shared/schema';
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
  CheckCircle2,
  ThumbsUp,
  Building,
  ShoppingBag,
  KeyRound
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

// Types for material interests
interface MaterialInterest {
  id: number;
  userId: number;
  collectionId: number;
  timestamp: Date;
  status: string;
  message: string | null;
  recycler?: {
    id: number;
    username: string;
    fullName: string;
    email: string;
    phone: string | null;
  } | null;
}

// Assigned / confirmed recycler (drop-off) section
interface DropoffRecyclerSectionProps {
  dropoffCenterId: number;
  isCompleted: boolean;
}

function DropoffRecyclerSection({ dropoffCenterId, isCompleted }: DropoffRecyclerSectionProps) {
  const { data: recycler, isLoading } = useQuery<any>({
    queryKey: ['/api/users', dropoffCenterId],
    enabled: !!dropoffCenterId,
    refetchOnWindowFocus: false,
    staleTime: 60000,
  });

  const title = isCompleted ? 'Recycler' : 'Drop-off Center';
  const badgeLabel = isCompleted ? 'Received' : 'Assigned';
  const badgeClass = isCompleted
    ? 'bg-green-50 text-green-700 border-green-200'
    : 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="bg-muted/50 p-3 rounded-md">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-sm">Loading recycler info…</span>
          </div>
        ) : recycler ? (
          <div className="grid gap-1.5">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{recycler.fullName || recycler.username}</span>
              <Badge variant="outline" className={`${badgeClass} text-xs`}>{badgeLabel}</Badge>
            </div>
            {recycler.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span>{recycler.email}</span>
              </div>
            )}
            {recycler.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{recycler.phone}</span>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-1">
              {recycler.email && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                  <a href={`mailto:${recycler.email}`}>
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </a>
                </Button>
              )}
              {recycler.phone && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                  <a href={`tel:${recycler.phone}`}>
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </a>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building className="h-4 w-4" />
            <span className="text-sm">Recycler information unavailable</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Interests Section Component
interface InterestsSectionProps {
  collectionId: number;
  showForRoles: string[]; // Which user roles should see this section
}

function InterestsSection({ collectionId, showForRoles }: InterestsSectionProps) {
  const { user } = useAuth();
  
  // Check if user role should see this section
  if (!user || !showForRoles.includes(user.role)) {
    return null;
  }
  
  // Fetch interests for this collection
  const { data: interests, isLoading } = useQuery<MaterialInterest[]>({
    queryKey: ['/api/collections', collectionId, 'interests'],
    enabled: !!collectionId,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });
  
  if (isLoading) {
    return (
      <div className="grid gap-2">
        <h3 className="text-sm font-medium">Recycler Interests</h3>
        <div className="bg-muted/50 p-3 rounded-md">
          <div className="flex items-center justify-center p-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="text-sm ml-2">Loading interests...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (!interests || !Array.isArray(interests) || interests.length === 0) {
    return (
      <div className="grid gap-2">
        <h3 className="text-sm font-medium">Recycler Interests</h3>
        <div className="bg-muted/50 p-3 rounded-md">
          <div className="flex items-center text-muted-foreground">
            <ThumbsUp className="h-4 w-4 mr-2" />
            <span className="text-sm">No recyclers have expressed interest yet</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-medium">Recycler Interests ({interests.length})</h3>
      <div className="bg-muted/50 p-3 rounded-md grid gap-3">
        {interests.map(interest => (
          <div key={interest.id} className="border border-border p-2 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {interest.recycler?.fullName || interest.recycler?.username || 'Unknown Recycler'}
                </span>
              </div>
              <Badge 
                variant="outline" 
                className={
                  interest.status === 'accepted' 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : interest.status === 'rejected'
                    ? "bg-red-50 text-red-700 border-red-200"
                    : interest.status === 'completed'
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }
              >
                {interest.status}
              </Badge>
            </div>
            
            <div className="grid gap-1.5 mt-1">
              {interest.recycler?.email && (
                <div className="flex items-center text-sm">
                  <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>{interest.recycler.email}</span>
                </div>
              )}
              {interest.recycler?.phone && (
                <div className="flex items-center text-sm">
                  <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <span>{interest.recycler.phone}</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                <a href={`mailto:${interest.recycler?.email}`}>
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </a>
              </Button>
              {interest.recycler?.phone && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                  <a href={`tel:${interest.recycler.phone}`}>
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </a>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CollectionDetailsDialogProps {
  collectionId: number | null;
  collection?: Collection | null; // Allow passing collection data directly
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CollectionDetailsDialog({ 
  collectionId, 
  collection: passedCollection, // Collection data passed directly
  open, 
  onOpenChange 
}: CollectionDetailsDialogProps) {
  const { user } = useAuth();
  // Fetch collection details only if not passed directly
  const { data: fetchedCollection, isLoading: isLoadingCollection } = useQuery<Collection>({
    queryKey: ['/api/collections', collectionId],
    enabled: open && !!collectionId && !passedCollection,
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
  
  // Use passed collection if available, otherwise use fetched collection
  const collection = passedCollection || fetchedCollection;

  // Fetch collector details if we have a collector ID
  const { data: collector, isLoading: isLoadingCollector } = useQuery<User>({
    queryKey: ['/api/users', collection?.collectorId],
    enabled: open && !!collection?.collectorId,
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
  
  // Fetch requester details (the user who created the collection)
  const { data: requester, isLoading: isLoadingRequester, error: requesterError } = useQuery<User>({
    queryKey: ['/api/users', collection?.userId],
    enabled: open && !!collection?.userId,
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 1,
    gcTime: 0, // Don't keep the data in cache
  });
  
  // Log debugging information
  React.useEffect(() => {
    if (collection?.userId) {
      console.log('Collection userId:', collection.userId);
      console.log('Requester data:', requester);
      if (requesterError) {
        console.error('Requester error:', requesterError);
      }
    }
  }, [collection?.userId, requester, requesterError]);

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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
            <DialogHeader className="sticky top-0 bg-background z-10 pb-4">
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
            
            <div className="grid gap-4 p-1">
                {/* Waste Information */}
                <div className="grid gap-2">
                  <h3 className="text-sm font-medium">Material Details</h3>
                  <div className="bg-muted/50 p-3 rounded-md grid gap-2">
                    <div className="flex items-center">
                      <PackageOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground mr-1">Type:</span>
                      <Badge 
                        variant="outline" 
                        className={`text-${getWasteTypeConfig(collection.wasteType).textColor} bg-${getWasteTypeConfig(collection.wasteType).bgColor}/10`}
                      >
                        {getWasteTypeConfig(collection.wasteType).label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center">
                      <Scale className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground mr-1">Amount:</span>
                      <span className="text-sm font-medium">{collection.wasteAmount ? `${formatNumber(collection.wasteAmount)} kg` : 'Not recorded'}</span>
                    </div>
                    
                    {(() => {
                      const estimate = getCustomerCostEstimate(collection.wasteType, collection.wasteAmount || 0);
                      const isHighValue = estimate.category === PricingCategory.HIGH_VALUE;
                      const isBreakEven = estimate.category === PricingCategory.BREAK_EVEN;
                      return (
                        <div className="flex items-center">
                          <CircleDollarSign className={`h-4 w-4 mr-2 ${isHighValue ? 'text-green-500' : isBreakEven ? 'text-blue-500' : 'text-orange-500'}`} />
                          <span className="text-sm text-muted-foreground mr-1">Est. Value:</span>
                          {isHighValue ? (
                            <span className="text-sm font-medium text-green-700">You earned KSh {formatNumber(Math.abs(estimate.total), 2)}</span>
                          ) : isBreakEven ? (
                            <span className="text-sm font-medium text-blue-700">Free collection</span>
                          ) : (
                            <span className="text-sm font-medium text-orange-700">Fee: KSh {formatNumber(estimate.total, 2)}</span>
                          )}
                        </div>
                      );
                    })()}
                    {user?.role === UserRole.COLLECTOR && collection.wasteAmount && (
                      <div className="flex items-center">
                        <CircleDollarSign className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-sm text-muted-foreground mr-1">Your earnings:</span>
                        <span className="text-sm font-medium text-green-700">KSh {formatNumber(getCollectorEarnings(collection.wasteType, collection.wasteAmount), 2)}</span>
                      </div>
                    )}
                    
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
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground mr-1">City:</span>
                      <span className="text-sm font-medium">{collection.city || 'Not specified'}</span>
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
                
                {collection.status === 'in_progress' && collection.verificationCode && user?.role !== 'collector' && (
                  <div className="grid gap-2">
                    <h3 className="text-sm font-medium">Pickup Verification</h3>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                      <div className="flex items-center gap-2 mb-1">
                        <KeyRound className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">Your verification code:</span>
                      </div>
                      <div className="text-center py-2">
                        <span className="font-mono font-bold text-2xl tracking-[0.3em] text-amber-900 bg-amber-100 px-4 py-1 rounded">
                          {collection.verificationCode}
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 text-center mt-1">Share this code with the collector to confirm your pickup</p>
                    </div>
                  </div>
                )}
                
                {/* Requester Information - For collectors and recyclers */}
                {(collection.userId && (user?.role === UserRole.COLLECTOR || user?.role === UserRole.RECYCLER)) && (
                  <div className="grid gap-2">
                    <h3 className="text-sm font-medium">Requester Information</h3>
                    <div className="bg-muted/50 p-3 rounded-md grid gap-2">
                      {isLoadingRequester ? (
                        <div className="flex items-center justify-center p-2">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                          <span className="text-sm ml-2">Loading requester details...</span>
                        </div>
                      ) : !requester ? (
                        <span className="text-sm text-muted-foreground">
                          Requester information not available (ID: {collection.userId})
                        </span>
                      ) : (
                        <>
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground mr-1">Name:</span>
                            <span className="text-sm font-medium">{requester.fullName}</span>
                          </div>
                          <div className="flex items-center">
                            <ShoppingBag className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground mr-1">Username:</span>
                            <span className="text-sm">@{requester.username}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground mr-1">Phone:</span>
                            <span className="text-sm">{requester.phone || 'Not provided'}</span>
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground mr-1">Email:</span>
                            <span className="text-sm">{requester.email}</span>
                          </div>
                          <div className="flex justify-end gap-2 mt-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                              <a href={`mailto:${requester.email}`}>
                                <Mail className="h-3 w-3 mr-1" />
                                Email
                              </a>
                            </Button>
                            {requester.phone && (
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                                <a href={`tel:${requester.phone}`}>
                                  <Phone className="h-3 w-3 mr-1" />
                                  Call
                                </a>
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Collector Information - show for all users if a collector is assigned */}
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
                          
                          {/* Contact buttons for collector */}
                          <div className="flex justify-end gap-2 mt-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                              <a href={`mailto:${collector.email}`}>
                                <Mail className="h-3 w-3 mr-1" />
                                Email
                              </a>
                            </Button>
                            {collector.phone && (
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                                <a href={`tel:${collector.phone}`}>
                                  <Phone className="h-3 w-3 mr-1" />
                                  Call
                                </a>
                              </Button>
                            )}
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
                
                {/* Drop-off center / recycler — show whenever one has been assigned */}
                {(collection as any).dropoffCenterId ? (
                  <DropoffRecyclerSection
                    dropoffCenterId={(collection as any).dropoffCenterId}
                    isCompleted={collection.status === 'completed'}
                  />
                ) : collection.status === 'completed' ? (
                  <InterestsSection 
                    collectionId={collection.id} 
                    showForRoles={[UserRole.COLLECTOR, UserRole.HOUSEHOLD, UserRole.ORGANIZATION]} 
                  />
                ) : null}
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