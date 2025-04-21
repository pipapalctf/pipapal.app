import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, Mail, Phone, ArrowRight, ExternalLink, User, Calendar, 
  Package, Trash2, Scale, CheckCircle, CheckCheck, XCircle, Clock,
  Info, DollarSign
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatNumber } from '@/lib/utils';
import { format } from 'date-fns';
import { wasteTypeConfig } from '@/lib/types';
import { Collection, CollectionStatus, MaterialInterest, User as UserType, WasteTypeValue } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface MaterialInterestsTabProps {
  collectorId: number;
}

// Helper function to get status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case CollectionStatus.PENDING:
      return 'text-yellow-600';
    case CollectionStatus.SCHEDULED:
      return 'text-blue-600';
    case CollectionStatus.IN_PROGRESS:
      return 'text-orange-600';
    case CollectionStatus.COMPLETED:
      return 'text-green-600';
    case CollectionStatus.CANCELLED:
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export function MaterialInterestsTab({ collectorId }: MaterialInterestsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  // Fetch all active collections (completed and in-progress) that belong to this collector
  const { data: activeCollections = [], isLoading: isLoadingCollections } = useQuery<Collection[]>({
    queryKey: ['/api/collections/collector', collectorId, 'active'],
    queryFn: async () => {
      const res = await fetch(`/api/collections/collector/${collectorId}/active`);
      if (!res.ok) throw new Error('Failed to fetch active collections');
      return res.json();
    },
    enabled: !!collectorId
  });

  // Define a type for the enhanced material interest response
  type EnhancedMaterialInterest = MaterialInterest & {
    recycler?: {
      id: number;
      username: string;
      fullName: string;
      email: string;
      phone: string | null;
    };
    collection?: {
      id: number;
      wasteType: string;
      wasteAmount: number | null;
      address: string;
      status: string;
    };
  };
  
  // Mutation for updating material interest status
  const updateInterestMutation = useMutation({
    mutationFn: async ({ interestId, status }: { interestId: number; status: 'accepted' | 'rejected' | 'completed' }) => {
      setIsUpdating(interestId);
      const response = await apiRequest(
        'PATCH',
        `/api/material-interests/${interestId}/status`,
        { status }
      );
      return await response.json();
    },
    onSuccess: () => {
      // Refetch interests after a successful update
      queryClient.invalidateQueries({ queryKey: ['/api/material-interests/collector', collectorId] });
      toast({
        title: 'Material interest updated',
        description: 'The material interest status has been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update material interest',
        description: error.message || 'An error occurred while updating the material interest.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsUpdating(null);
    }
  });

  // Fetch material interests for all collections
  const { data: collectionInterests = [], isLoading: isLoadingInterests } = useQuery<EnhancedMaterialInterest[]>({
    queryKey: ['/api/material-interests/collector', collectorId],
    queryFn: async () => {
      const res = await fetch(`/api/material-interests/collector/${collectorId}`);
      if (!res.ok) throw new Error('Failed to fetch material interests');
      return res.json();
    },
    enabled: !!collectorId
  });

  // Calculate pagination
  const totalPages = Math.ceil(collectionInterests.length / itemsPerPage);
  const paginatedInterests = collectionInterests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isLoading = isLoadingCollections || isLoadingInterests;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (activeCollections.length === 0) {
    return (
      <Alert className="my-4">
        <AlertTitle>No active collections</AlertTitle>
        <AlertDescription>
          You don't have any active collections yet. Once you have collections in progress or completed, recyclers can express interest in the materials.
        </AlertDescription>
      </Alert>
    );
  }

  if (collectionInterests.length === 0) {
    return (
      <Alert className="my-4">
        <AlertTitle>No interests found</AlertTitle>
        <AlertDescription>
          No recyclers have expressed interest in your collected materials yet.
        </AlertDescription>
      </Alert>
    );
  }

  // Helper function to extract price from message
  const extractPriceFromMessage = (message: string): { pricePerKg: number | null, totalOffer: number | null } => {
    try {
      // Look for KSh XX.XX per kg pattern
      const pricePerKgMatch = message.match(/KSh\s+(\d+(?:\.\d+)?)\s+per\s+kg/i);
      const pricePerKg = pricePerKgMatch ? parseFloat(pricePerKgMatch[1]) : null;
      
      // Look for Total offer: KSh XXXX.XX pattern
      const totalOfferMatch = message.match(/Total\s+offer:\s+KSh\s+(\d+(?:,\d+)*(?:\.\d+)?)/i);
      const totalOfferString = totalOfferMatch ? totalOfferMatch[1].replace(/,/g, '') : null;
      const totalOffer = totalOfferString ? parseFloat(totalOfferString) : null;
      
      return { pricePerKg, totalOffer };
    } catch (e) {
      return { pricePerKg: null, totalOffer: null };
    }
  };

  // Component for displaying details dialog
  const InterestDetailsDialog = ({ interest }: { interest: EnhancedMaterialInterest }) => {
    const { recycler, collection } = interest;
    if (!recycler || !collection) return null;
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Info className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4">
            <DialogTitle>Interest Details</DialogTitle>
            <DialogDescription>
              Material interest information from {recycler.fullName || recycler.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Recycler Information */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Recycler</h3>
              <div className="bg-muted/50 p-4 rounded-md space-y-2">
                <div className="flex items-start">
                  <User className="h-4 w-4 mt-1 mr-2 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{recycler.fullName || recycler.username}</div>
                    {recycler.fullName && recycler.username && (
                      <div className="text-sm text-muted-foreground">@{recycler.username}</div>
                    )}
                  </div>
                </div>
                
                {recycler.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a href={`mailto:${recycler.email}`} className="text-primary hover:underline">
                      {recycler.email}
                    </a>
                  </div>
                )}
                
                {recycler.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a href={`tel:${recycler.phone}`} className="text-primary hover:underline">
                      {recycler.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            {/* Collection Information */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Collection</h3>
              <div className="bg-muted/50 p-4 rounded-md space-y-2">
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <span>Collection #{collection.id}</span>
                    <Badge variant="outline" className={`${getStatusColor(collection.status)}`}>
                      {collection.status.charAt(0).toUpperCase() + collection.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-4 w-4 mt-0.5 mr-2 text-muted-foreground" />
                  <div>
                    <div>{format(new Date(interest.timestamp), 'MMM d, yyyy')}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(interest.timestamp), 'h:mm a')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  {wasteTypeConfig[collection.wasteType as WasteTypeValue]?.icon ? (
                    <span className="mr-2">{wasteTypeConfig[collection.wasteType as WasteTypeValue]?.icon}</span>
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  )}
                  <div>
                    <div className="capitalize">{collection.wasteType}</div>
                    {collection.wasteAmount && (
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Scale className="mr-1 h-3 w-3" />
                        {formatNumber(collection.wasteAmount)} kg
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <ExternalLink className="h-4 w-4 mt-0.5 mr-2 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-sm">{collection.address}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Message & Offer */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Message & Offer</h3>
              <div className="bg-muted/50 p-4 rounded-md">
                <div className="mb-4">
                  {interest.message ? (
                    <div className="whitespace-pre-wrap">{interest.message}</div>
                  ) : (
                    <span className="text-muted-foreground italic">No message provided</span>
                  )}
                </div>
                
                {interest.message && extractPriceFromMessage(interest.message).pricePerKg && (
                  <div className="mt-4 border-t pt-4">
                    <div className="font-semibold mb-2">Price Offer:</div>
                    <div className="flex items-center text-green-700 font-medium">
                      <DollarSign className="h-4 w-4 mr-1" />
                      KSh {extractPriceFromMessage(interest.message).pricePerKg?.toFixed(2)} per kg
                    </div>
                    {extractPriceFromMessage(interest.message).totalOffer && (
                      <div className="text-sm mt-1">
                        Total offer: KSh {formatNumber(extractPriceFromMessage(interest.message).totalOffer || 0)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-6 sticky bottom-0 bg-white pt-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-28">Date</TableHead>
              <TableHead className="w-36">Recycler</TableHead>
              <TableHead className="w-32">Collection</TableHead>
              <TableHead className="w-40">Material</TableHead>
              <TableHead className="w-36">Price Offer</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y">
            {paginatedInterests.map((interest) => {
              // Enhanced interest will have recycler and collection data directly
              const { recycler, collection } = interest;
              
              // Skip if either is missing
              if (!recycler || !collection) return null;
              
              // Extract price information from message
              const { pricePerKg, totalOffer } = extractPriceFromMessage(interest.message || '');
              
              return (
                <TableRow key={interest.id} className="hover:bg-muted/50">
                  <TableCell className="align-top py-4">
                    <div className="flex flex-col">
                      <div className="font-medium">
                        {format(new Date(interest.timestamp), 'MMM d, yyyy')}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(interest.timestamp), 'h:mm a')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-4">
                    <div className="flex flex-col">
                      <div className="font-medium">{recycler.fullName || recycler.username}</div>
                      {recycler.fullName && recycler.username && (
                        <div className="text-xs text-muted-foreground">@{recycler.username}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-4">
                    <div className="flex flex-col">
                      <div className="font-medium flex items-center gap-1">
                        #{collection.id}
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(collection.status).replace('text-', 'bg-')}`}></span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {collection.address}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-4">
                    <div className="flex items-center space-x-2">
                      {wasteTypeConfig[collection.wasteType as WasteTypeValue]?.icon ? (
                        <span>{wasteTypeConfig[collection.wasteType as WasteTypeValue]?.icon}</span>
                      ) : (
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium capitalize">{collection.wasteType}</div>
                        {collection.wasteAmount && (
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Scale className="mr-1 h-3 w-3" />
                            {formatNumber(collection.wasteAmount)} kg
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top py-4">
                    {pricePerKg ? (
                      <div className="flex flex-col">
                        <div className="font-medium text-green-700 flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          KSh {pricePerKg.toFixed(2)}/kg
                        </div>
                        {totalOffer && (
                          <div className="text-xs text-green-600">
                            Total: KSh {formatNumber(totalOffer || 0)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm italic">No price offered</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top py-4">
                    {interest.status === 'completed' ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
                        <CheckCheck className="mr-1 h-3 w-3" /> Completed
                      </Badge>
                    ) : interest.status === 'accepted' ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                        <CheckCheck className="mr-1 h-3 w-3" /> Accepted
                      </Badge>
                    ) : interest.status === 'rejected' ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200">
                        <XCircle className="mr-1 h-3 w-3" /> Rejected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200">
                        <Clock className="mr-1 h-3 w-3" /> Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="align-top py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <InterestDetailsDialog interest={interest} />
                      
                      {!interest.status || interest.status === 'pending' ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => updateInterestMutation.mutate({ 
                              interestId: interest.id, 
                              status: 'accepted'
                            })}
                            disabled={isUpdating === interest.id || updateInterestMutation.isPending}
                          >
                            {isUpdating === interest.id ? 
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : 
                              <CheckCircle className="mr-1 h-3 w-3" />
                            }
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-600 text-red-600 hover:bg-red-50"
                            onClick={() => updateInterestMutation.mutate({ 
                              interestId: interest.id, 
                              status: 'rejected' 
                            })}
                            disabled={isUpdating === interest.id || updateInterestMutation.isPending}
                          >
                            {isUpdating === interest.id ? 
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : 
                              <XCircle className="mr-1 h-3 w-3" />
                            }
                            Reject
                          </Button>
                        </>
                      ) : interest.status === 'accepted' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => updateInterestMutation.mutate({ 
                            interestId: interest.id, 
                            status: 'completed'
                          })}
                          disabled={isUpdating === interest.id || updateInterestMutation.isPending}
                        >
                          {isUpdating === interest.id ? 
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : 
                            <CheckCheck className="mr-1 h-3 w-3" />
                          }
                          Mark as Completed
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">
                          {interest.status === 'completed' ? 'Transaction completed' : `Already ${interest.status}`}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, collectionInterests.length)} of {collectionInterests.length} interests
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="flex items-center px-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MaterialInterestsTab;