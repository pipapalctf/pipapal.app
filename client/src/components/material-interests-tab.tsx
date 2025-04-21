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
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface MaterialInterestsTabProps {
  collectorId: number;
}

export function MaterialInterestsTab({ collectorId }: MaterialInterestsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all completed collections that belong to this collector
  const { data: completedCollections = [], isLoading: isLoadingCollections } = useQuery({
    queryKey: ['/api/collections/collector', collectorId, 'completed'],
    queryFn: async () => {
      const res = await fetch(`/api/collections/collector/${collectorId}/completed`);
      if (!res.ok) throw new Error('Failed to fetch completed collections');
      return res.json();
    },
    enabled: !!collectorId
  });

  // Fetch material interests for all collections
  const { data: collectionInterests = [], isLoading: isLoadingInterests } = useQuery({
    queryKey: ['/api/material-interests/collector', collectorId],
    queryFn: async () => {
      const res = await fetch(`/api/material-interests/collector/${collectorId}`);
      if (!res.ok) throw new Error('Failed to fetch material interests');
      return res.json();
    },
    enabled: !!collectorId && completedCollections.length > 0
  });

  // Fetch all users to get recycler information
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!collectionInterests && collectionInterests.length > 0
  });

  // Helper function to get recycler info
  const getRecyclerInfo = (userId: number) => {
    return users.find((user: any) => user.id === userId);
  };

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
          {paginatedInterests.map((interest: any) => {
            const collection = completedCollections.find((c: any) => c.id === interest.collectionId);
            const recycler = getRecyclerInfo(interest.userId);
            
            if (!collection || !recycler) return null;
            
            return (
              <TableRow key={interest.id} className="group hover:bg-muted/50">
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {format(new Date(interest.createdAt), 'MMM d, yyyy')}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(interest.createdAt), 'h:mm a')}
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
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(collection.completedDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {wasteTypeConfig[collection.wasteType]?.icon ? (
                      <span className="mr-2">{wasteTypeConfig[collection.wasteType]?.icon}</span>
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
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-4 py-2">
                  Page {currentPage} of {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

export default MaterialInterestsTab;