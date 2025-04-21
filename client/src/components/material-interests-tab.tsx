import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Phone, ArrowRight, ExternalLink, User, Calendar, Package, Trash2, Scale } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatNumber } from '@/lib/utils';
import { format } from 'date-fns';
import { wasteTypeConfig } from '@/lib/types';
import { Collection, MaterialInterest, User as UserType, WasteTypeValue } from '@shared/schema';

interface MaterialInterestsTabProps {
  collectorId: number;
}

export function MaterialInterestsTab({ collectorId }: MaterialInterestsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all completed collections that belong to this collector
  const { data: completedCollections = [], isLoading: isLoadingCollections } = useQuery<Collection[]>({
    queryKey: ['/api/collections/collector', collectorId, 'completed'],
    queryFn: async () => {
      const res = await fetch(`/api/collections/collector/${collectorId}/completed`);
      if (!res.ok) throw new Error('Failed to fetch completed collections');
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
    };
  };

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

  if (completedCollections.length === 0) {
    return (
      <Alert className="my-4">
        <AlertTitle>No completed collections</AlertTitle>
        <AlertDescription>
          You don't have any completed collections yet. Once you complete collections, recyclers can express interest in the materials.
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

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Recycler</TableHead>
            <TableHead>Collection</TableHead>
            <TableHead>Material</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedInterests.map((interest) => {
            // Enhanced interest will have recycler and collection data directly
            const { recycler, collection } = interest;
            
            // Skip if either is missing
            if (!recycler || !collection) return null;
            
            return (
              <TableRow key={interest.id} className="group hover:bg-muted/50">
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {format(new Date(interest.timestamp), 'MMM d, yyyy')}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(interest.timestamp), 'h:mm a')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{recycler.fullName || recycler.username}</div>
                      {recycler.fullName && recycler.username && (
                        <div className="text-xs text-muted-foreground">@{recycler.username}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">#{collection.id}</span>
                    {/* If we need the completed date, we can fetch it from the completedCollections array */}
                    <span className="text-xs text-muted-foreground">
                      {collection.address ? collection.address.substring(0, 20) + '...' : ''}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {wasteTypeConfig[collection.wasteType as WasteTypeValue]?.icon ? (
                      <span className="mr-2">{wasteTypeConfig[collection.wasteType as WasteTypeValue]?.icon}</span>
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <div className="capitalize">{collection.wasteType}</div>
                      {collection.wasteAmount && (
                        <div className="text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Scale className="mr-1 h-3 w-3" />
                            {formatNumber(collection.wasteAmount)} kg
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {recycler.email && (
                      <a
                        href={`mailto:${recycler.email}`}
                        className="flex items-center text-xs text-blue-600 hover:underline"
                      >
                        <Mail className="mr-1 h-3 w-3" />
                        {recycler.email}
                      </a>
                    )}
                    {recycler.phone && (
                      <a
                        href={`tel:${recycler.phone}`}
                        className="flex items-center text-xs text-blue-600 hover:underline"
                      >
                        <Phone className="mr-1 h-3 w-3" />
                        {recycler.phone}
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate">
                    {interest.message || <span className="text-muted-foreground italic text-sm">No message</span>}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <span className="flex items-center px-4">
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
      )}
    </div>
  );
}

export default MaterialInterestsTab;