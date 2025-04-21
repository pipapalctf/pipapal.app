import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CollectionStatus, UserRole, WasteType } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Calendar, CheckCircle, Clock, Filter, MapPin, Search, Truck, Package, AlertTriangle, Trash2, ClipboardCheck, ArrowRight, CalendarClock, CheckCheck, X, Map, XCircle, Activity, Scale, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { wasteTypeConfig } from '@/lib/types';
import { format } from 'date-fns';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';
import { Separator } from '@/components/ui/separator';
import { MaterialInterestsTab } from '@/components/material-interests-tab';
import { useLocation } from 'wouter';

export default function CollectorCollectionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<string>('collections');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [wasteAmount, setWasteAmount] = useState<string>('');
  const [statusUpdateModal, setStatusUpdateModal] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  
  // Check URL parameters for tab selection
  useEffect(() => {
    // Parse the URL search params to check for tab parameter
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    
    // Set the active tab if the parameter exists and is valid
    if (tabParam === 'interests') {
      setActiveTab('interests');
    }
  }, [location]);
  
  // Fetch users for requester information
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user,
  });

  // Make sure only collectors can access this page
  if (user?.role !== UserRole.COLLECTOR) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>This page is only available to collectors.</p>
      </div>
    );
  }

  // Fetch collections from the API
  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['/api/collections'],
  });
  
  // Fetch material interests for collections assigned to this collector
  const { data: materialInterests = [] } = useQuery({
    queryKey: ['/api/material-interests/collector', user.id],
    queryFn: async () => {
      const res = await fetch(`/api/material-interests/collector/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch material interests');
      return res.json();
    },
    enabled: !!user.id
  });

  // Filter collections by collector and status
  const filteredCollections = collections
    .filter((collection: any) => {
      // Show collections that are:
      // 1. Assigned to this collector OR
      // 2. Unassigned and scheduled (available for claiming) OR
      // 3. In the process of being claimed by this collector
      const isRelevantToCollector = 
        collection.collectorId === user.id || 
        (!collection.collectorId && collection.status === CollectionStatus.SCHEDULED) ||
        (currentlyClaimingId === collection.id);
      
      // Apply status filter
      const matchesStatus = 
        statusFilter === 'all' || 
        collection.status === statusFilter || 
        (statusFilter === 'unassigned' && !collection.collectorId);
      
      // Apply search filter (address or waste type)
      const matchesSearch = 
        searchQuery === '' || 
        collection.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collection.wasteType?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return isRelevantToCollector && matchesStatus && matchesSearch;
    })
    .sort((a: any, b: any) => {
      // Sort by scheduled date, newest first
      return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
    });

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  
  // Group collections by status for the dashboard
  const collectionsCountByStatus = {
    scheduled: filteredCollections.filter(c => c.status === CollectionStatus.SCHEDULED).length,
    pending: filteredCollections.filter(c => c.status === CollectionStatus.PENDING).length,
    confirmed: filteredCollections.filter(c => c.status === CollectionStatus.CONFIRMED).length,
    in_progress: filteredCollections.filter(c => c.status === CollectionStatus.IN_PROGRESS).length,
    completed: filteredCollections.filter(c => c.status === CollectionStatus.COMPLETED).length,
    cancelled: filteredCollections.filter(c => c.status === CollectionStatus.CANCELLED).length,
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredCollections.length / itemsPerPage);
  const paginatedCollections = filteredCollections.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Claim a collection (assign to self)
  const [currentlyClaimingId, setCurrentlyClaimingId] = useState<number | null>(null);
  
  const claimCollectionMutation = useMutation({
    mutationFn: async (collectionId: number) => {
      // Set which collection is currently being claimed
      setCurrentlyClaimingId(collectionId);
      
      // First verify if the collection is still available
      const checkRes = await apiRequest('GET', `/api/collections/${collectionId}`);
      const collection = await checkRes.json();
      
      if (collection.collectorId) {
        throw new Error('This collection has already been claimed by another collector');
      }
      
      // Update the collection
      const res = await apiRequest('PATCH', `/api/collections/${collectionId}`, {
        collectorId: user.id,
        status: CollectionStatus.CONFIRMED
      });
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      toast({
        title: 'Collection claimed',
        description: 'You have successfully claimed this collection.',
        variant: 'default',
      });
      // Reset claiming state
      setCurrentlyClaimingId(null);
      // Switch to confirmed status to show the newly claimed collection
      setStatusFilter(CollectionStatus.CONFIRMED);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to claim collection',
        description: error.message,
        variant: 'destructive',
      });
      // Reset claiming state
      setCurrentlyClaimingId(null);
    }
  });

  // Update collection status
  const updateCollectionStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes, wasteAmount }: { id: number; status: string; notes?: string; wasteAmount?: number }) => {
      const updateData: any = { status };
      
      if (notes) {
        updateData.notes = notes;
      }
      
      if (wasteAmount && status === CollectionStatus.COMPLETED) {
        updateData.wasteAmount = wasteAmount;
        // The completed date will be set automatically by the server
      }
      
      const res = await apiRequest('PATCH', `/api/collections/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      setStatusUpdateModal(false);
      setSelectedCollection(null);
      setWasteAmount('');
      setNotesInput('');
      toast({
        title: 'Collection updated',
        description: 'The collection status has been updated successfully.',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update collection',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Helper function to get the next possible status
  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case CollectionStatus.SCHEDULED:
        return CollectionStatus.CONFIRMED;
      case CollectionStatus.CONFIRMED:
        return CollectionStatus.IN_PROGRESS;
      case CollectionStatus.PENDING:
        return CollectionStatus.CONFIRMED;
      case CollectionStatus.IN_PROGRESS:
        return CollectionStatus.COMPLETED;
      default:
        return null;
    }
  };

  // Color coding for collection status
  const getStatusColor = (status: string) => {
    switch (status) {
      case CollectionStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case CollectionStatus.PENDING:
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case CollectionStatus.CONFIRMED:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case CollectionStatus.IN_PROGRESS:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case CollectionStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200';
      case CollectionStatus.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Generate an action button based on collection status
  const getActionButton = (collection: any) => {
    const nextStatus = getNextStatus(collection.status);
    
    if (!collection.collectorId && collection.status === CollectionStatus.SCHEDULED) {
      const isClaimingThis = currentlyClaimingId === collection.id;
      return (
        <Button 
          size="sm" 
          variant="default" 
          className="w-full"
          onClick={() => claimCollectionMutation.mutate(collection.id)}
          disabled={claimCollectionMutation.isPending || isClaimingThis}
        >
          {isClaimingThis ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Claiming...
            </>
          ) : (
            <>
              <Truck className="mr-2 h-4 w-4" />
              Claim Pickup
            </>
          )}
        </Button>
      );
    }
    
    if (nextStatus && collection.collectorId === user.id) {
      return (
        <Button 
          size="sm" 
          variant={nextStatus === CollectionStatus.COMPLETED ? "default" : "outline"} 
          className="w-full"
          onClick={() => {
            setSelectedCollection(collection);
            setStatusUpdateModal(true);
          }}
        >
          {nextStatus === CollectionStatus.CONFIRMED && (
            <><CheckCircle className="mr-2 h-4 w-4" />Confirm</>
          )}
          {nextStatus === CollectionStatus.IN_PROGRESS && (
            <><Truck className="mr-2 h-4 w-4" />Start Pickup</>
          )}
          {nextStatus === CollectionStatus.COMPLETED && (
            <><CheckCheck className="mr-2 h-4 w-4" />Complete</>
          )}
        </Button>
      );
    }
    
    return null;
  };

  // Format the address for display
  const formatAddress = (address: string) => {
    if (!address) return "No address provided";
    if (address.length > 40) {
      return address.substring(0, 40) + "...";
    }
    return address;
  };
  
  // Get requester (user) data for a collection
  const getRequesterInfo = (userId: number) => {
    if (!users || !Array.isArray(users) || users.length === 0) return null;
    return users.find((u: any) => u.id === userId);
  };
  
  // Check if a collection has material interests from recyclers
  const hasInterests = (collectionId: number) => {
    return materialInterests.some((interest: any) => 
      interest.collectionId === collectionId && 
      ['expressed', 'accepted'].includes(interest.status)
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto py-6 px-4 md:px-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Collection Management</h1>
            <p className="text-muted-foreground">
              View and manage waste collection pickups assigned to you
            </p>
          </div>
          
          {/* Status Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className={`bg-white hover:shadow-md transition-shadow ${statusFilter === 'all' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => setStatusFilter('all')}>
              <CardContent className="p-4 flex flex-col items-center cursor-pointer">
                <Package className="h-5 w-5 mb-1 text-gray-500" />
                <p className="text-sm font-medium">All</p>
                <p className="text-2xl font-bold">{filteredCollections.length}</p>
              </CardContent>
            </Card>
            
            <Card className={`bg-white hover:shadow-md transition-shadow ${statusFilter === 'unassigned' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => setStatusFilter('unassigned')}>
              <CardContent className="p-4 flex flex-col items-center cursor-pointer">
                <AlertTriangle className="h-5 w-5 mb-1 text-amber-500" />
                <p className="text-sm font-medium">Unassigned</p>
                <p className="text-2xl font-bold">
                  {collections.filter(c => !c.collectorId && c.status === CollectionStatus.SCHEDULED).length}
                </p>
              </CardContent>
            </Card>
            
            <Card className={`bg-white hover:shadow-md transition-shadow ${statusFilter === CollectionStatus.CONFIRMED ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => setStatusFilter(CollectionStatus.CONFIRMED)}>
              <CardContent className="p-4 flex flex-col items-center cursor-pointer">
                <CheckCircle className="h-5 w-5 mb-1 text-indigo-500" />
                <p className="text-sm font-medium">Confirmed</p>
                <p className="text-2xl font-bold">{collectionsCountByStatus.confirmed}</p>
              </CardContent>
            </Card>
            
            <Card className={`bg-white hover:shadow-md transition-shadow ${statusFilter === CollectionStatus.IN_PROGRESS ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => setStatusFilter(CollectionStatus.IN_PROGRESS)}>
              <CardContent className="p-4 flex flex-col items-center cursor-pointer">
                <Truck className="h-5 w-5 mb-1 text-purple-500" />
                <p className="text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold">{collectionsCountByStatus.in_progress}</p>
              </CardContent>
            </Card>
            
            <Card className={`bg-white hover:shadow-md transition-shadow ${statusFilter === CollectionStatus.COMPLETED ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => setStatusFilter(CollectionStatus.COMPLETED)}>
              <CardContent className="p-4 flex flex-col items-center cursor-pointer">
                <CheckCheck className="h-5 w-5 mb-1 text-green-500" />
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold">{collectionsCountByStatus.completed}</p>
              </CardContent>
            </Card>
            
            <Card className={`bg-white hover:shadow-md transition-shadow ${statusFilter === CollectionStatus.CANCELLED ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => setStatusFilter(CollectionStatus.CANCELLED)}>
              <CardContent className="p-4 flex flex-col items-center cursor-pointer">
                <XCircle className="h-5 w-5 mb-1 text-red-500" />
                <p className="text-sm font-medium">Cancelled</p>
                <p className="text-2xl font-bold">{collectionsCountByStatus.cancelled}</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by address or waste type..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collections</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value={CollectionStatus.SCHEDULED}>Scheduled</SelectItem>
                <SelectItem value={CollectionStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={CollectionStatus.CONFIRMED}>Confirmed</SelectItem>
                <SelectItem value={CollectionStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={CollectionStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={CollectionStatus.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Tabs for Collections and Material Interests */}
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="collections">Collection Assignments</TabsTrigger>
              <TabsTrigger value="interests">Material Interests</TabsTrigger>
            </TabsList>
            
            {/* Collections Tab Content */}
            <TabsContent value="collections" className="mt-0">
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <CardTitle>Collection Assignments</CardTitle>
                  <CardDescription>
                    {filteredCollections.length} {filteredCollections.length === 1 ? 'collection' : 'collections'} {statusFilter !== 'all' ? `(filtered by: ${statusFilter})` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
              ) : filteredCollections.length === 0 ? (
                <div className="p-6 text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="font-medium text-lg">No collections found</h3>
                  <p className="text-muted-foreground">
                    {statusFilter !== 'all' 
                      ? `There are no ${statusFilter} collections at the moment.` 
                      : "There are no collections to display."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Waste Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCollections.map((collection: any) => (
                        <TableRow key={collection.id} className="group hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              #{collection.id}
                              {hasInterests(collection.id) && (
                                <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-800 border-indigo-200 flex items-center">
                                  <span className="h-2 w-2 bg-indigo-500 rounded-full mr-1 animate-pulse"></span>
                                  Interest
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${getStatusColor(collection.status)}`}>
                              {collection.status.charAt(0).toUpperCase() + collection.status.slice(1)}
                            </Badge>
                            {!collection.collectorId && (
                              <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-800 border-yellow-200">
                                Unassigned
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                              {format(new Date(collection.scheduledDate), 'MMM d, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {wasteTypeConfig[collection.wasteType as keyof typeof wasteTypeConfig]?.icon ? (
                                <span className="mr-2">{wasteTypeConfig[collection.wasteType as keyof typeof wasteTypeConfig]?.icon}</span>
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="capitalize">{collection.wasteType}</span>
                              {collection.wasteAmount && (
                                <Badge variant="outline" className="ml-2 bg-teal-50 text-teal-700 border-teal-200">
                                  {formatNumber(collection.wasteAmount)} kg
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                              {formatAddress(collection.address)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {getActionButton(collection)}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedCollection(collection);
                                  setNotesInput(collection.notes || '');
                                }}
                                title="View Collection Details"
                                className="relative group"
                              >
                                <Activity className="h-4 w-4" />
                                <span className="sr-only">View Details</span>
                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  View Details
                                </div>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-6 space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous Page</span>
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next Page</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
              </Card>
            </TabsContent>
            
            {/* Material Interests Tab Content */}
            <TabsContent value="interests" className="mt-0">
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <CardTitle>Material Interests from Recyclers</CardTitle>
                  <CardDescription>
                    View recyclers who expressed interest in materials from your active collections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* We'll create this component next */}
                  <MaterialInterestsTab collectorId={user.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Collection Details Dialog */}
      {selectedCollection && (
        <Dialog open={!!selectedCollection} onOpenChange={(open) => !open && setSelectedCollection(null)}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Collection #{selectedCollection.id}</DialogTitle>
              <DialogDescription>
                Scheduled for {format(new Date(selectedCollection.scheduledDate), 'MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Requester Information */}
              {selectedCollection.userId && (
                <div className="grid grid-cols-4 items-start gap-4 mb-2">
                  <Label className="text-right">Requester</Label>
                  <div className="col-span-3 flex flex-col">
                    {(() => {
                      const requester = getRequesterInfo(selectedCollection.userId);
                      if (!requester) return <span className="text-muted-foreground text-sm">User information not available</span>;
                      
                      return (
                        <div className="flex flex-col gap-1">
                          <div className="font-medium">{requester.fullName || requester.username}</div>
                          {requester.fullName && requester.username && (
                            <div className="text-sm text-muted-foreground">@{requester.username}</div>
                          )}
                          {requester.email && (
                            <div className="text-sm flex items-center gap-1 mt-1">
                              <span className="text-muted-foreground">Email:</span> 
                              <span>{requester.email}</span>
                            </div>
                          )}
                          {requester.phone && (
                            <div className="text-sm flex items-center gap-1">
                              <span className="text-muted-foreground">Phone:</span> 
                              <span>{requester.phone}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <div className="col-span-3">
                  <Badge variant="outline" className={`${getStatusColor(selectedCollection.status)}`}>
                    {selectedCollection.status.charAt(0).toUpperCase() + selectedCollection.status.slice(1)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Waste Type</Label>
                <div className="col-span-3 flex items-center">
                  {wasteTypeConfig[selectedCollection.wasteType as keyof typeof wasteTypeConfig]?.icon ? (
                    <span className="mr-2">{wasteTypeConfig[selectedCollection.wasteType as keyof typeof wasteTypeConfig]?.icon}</span>
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="capitalize">{selectedCollection.wasteType}</span>
                </div>
              </div>
              
              {selectedCollection.wasteAmount && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Amount</Label>
                  <div className="col-span-3 flex items-center">
                    <Scale className="mr-2 h-4 w-4 text-muted-foreground" />
                    {formatNumber(selectedCollection.wasteAmount)} kg
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Address</Label>
                <div className="col-span-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{selectedCollection.address}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Notes</Label>
                <Textarea 
                  className="col-span-3" 
                  placeholder="Add notes about this collection..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter className="sm:justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedCollection(null);
                  setNotesInput('');
                }}
              >
                Close
              </Button>
              
              <div className="flex gap-2">
                {selectedCollection.notes !== notesInput && (
                  <Button
                    onClick={() => updateCollectionStatusMutation.mutate({
                      id: selectedCollection.id,
                      status: selectedCollection.status,
                      notes: notesInput
                    })}
                    disabled={updateCollectionStatusMutation.isPending}
                  >
                    Save Notes
                  </Button>
                )}
                
                {getNextStatus(selectedCollection.status) && selectedCollection.collectorId === user.id && (
                  <Button
                    onClick={() => {
                      setStatusUpdateModal(true);
                    }}
                    variant="default"
                  >
                    Update Status
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Status Update Modal */}
      {selectedCollection && (
        <Dialog open={statusUpdateModal} onOpenChange={setStatusUpdateModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Update Collection Status</DialogTitle>
              <DialogDescription>
                Change status from <span className="font-medium capitalize">{selectedCollection.status}</span> to <span className="font-medium capitalize">{getNextStatus(selectedCollection.status)}</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {getNextStatus(selectedCollection.status) === CollectionStatus.COMPLETED && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="wasteAmount" className="text-right">
                      Waste Amount (kg)
                    </Label>
                    <Input
                      id="wasteAmount"
                      className="col-span-3"
                      type="number"
                      value={wasteAmount}
                      onChange={(e) => setWasteAmount(e.target.value)}
                      placeholder="Enter amount in kg"
                    />
                  </div>
                </>
              )}
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right pt-2">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  className="col-span-3"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Add any notes about this status update..."
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setStatusUpdateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const nextStatus = getNextStatus(selectedCollection.status);
                  if (!nextStatus) return;
                  
                  const data: any = {
                    id: selectedCollection.id,
                    status: nextStatus,
                    notes: notesInput
                  };
                  
                  if (nextStatus === CollectionStatus.COMPLETED && wasteAmount) {
                    data.wasteAmount = parseFloat(wasteAmount);
                  }
                  
                  updateCollectionStatusMutation.mutate(data);
                }}
                disabled={
                  updateCollectionStatusMutation.isPending || 
                  (getNextStatus(selectedCollection.status) === CollectionStatus.COMPLETED && !wasteAmount)
                }
              >
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      <Footer />
    </div>
  );
}