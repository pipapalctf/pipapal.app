import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CollectionStatus, UserRole, getCollectorEarnings } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Calendar, CheckCircle, CheckCircle2, Clock, Filter, MapPin, Search, Truck, Package, AlertTriangle, Trash2, ClipboardCheck, ArrowRight, CalendarClock, CheckCheck, X, Map, XCircle, Activity, Scale, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Loader2, MoreHorizontal, Route, CreditCard } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { wasteTypeConfig } from '@/lib/types';
import { format } from 'date-fns';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';
import { Separator } from '@/components/ui/separator';
import { RouteOptimizationMap } from '@/components/maps/route-optimization-map';
import { useLocation } from 'wouter';
import { ClaimPickupDialog } from '@/components/claim-pickup-dialog';

export default function CollectorCollectionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<string>('collections');
  const [statusFilter, setStatusFilter] = useState<string>('unassigned');
  const [searchQuery, setSearchQuery] = useState('');
  const [wasteTypeFilter, setWasteTypeFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [wasteAmount, setWasteAmount] = useState<string>('');
  const [statusUpdateModal, setStatusUpdateModal] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [claimingCollection, setClaimingCollection] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkClaimDialogOpen, setBulkClaimDialogOpen] = useState(false);
  const [confirmingDropoffId, setConfirmingDropoffId] = useState<number | null>(null);
  const [dropoffCodeInput, setDropoffCodeInput] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  
  const [sortField, setSortField] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'interests') {
      setActiveTab('interests');
    }
  }, [location]);
  
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!user,
  });

  if (user?.role !== UserRole.COLLECTOR) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>This page is only available to collectors.</p>
      </div>
    );
  }

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['/api/collections'],
  });
  

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1">
        {sortOrder === 'asc' ? 
          <ChevronUp className="h-4 w-4" /> : 
          <ChevronDown className="h-4 w-4" />}
      </span>
    );
  };

  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    collections.forEach((c: any) => {
      if (c.city) cities.add(c.city);
      else if (c.address) {
        const parts = c.address.split(',');
        if (parts.length > 1) cities.add(parts[parts.length - 1].trim());
      }
    });
    return Array.from(cities).sort();
  }, [collections]);

  const isUnassignedView = statusFilter === 'unassigned';
  const isAllMineView = statusFilter === 'all';
  const isSingleStatusView = !isUnassignedView && !isAllMineView;

  const filteredCollections = collections
    .filter((collection: any) => {
      const isRelevantToCollector = 
        collection.collectorId === user.id || 
        (!collection.collectorId && collection.status === CollectionStatus.SCHEDULED);
      
      const matchesStatus = 
        statusFilter === 'all' || 
        collection.status === statusFilter || 
        (statusFilter === 'unassigned' && !collection.collectorId);
      
      const matchesSearch = 
        searchQuery === '' || 
        collection.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collection.wasteType?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesWasteType =
        wasteTypeFilter === 'all' ||
        collection.wasteType === wasteTypeFilter;

      const matchesCity =
        cityFilter === 'all' ||
        collection.city === cityFilter ||
        (collection.address && collection.address.includes(cityFilter));
      
      return isRelevantToCollector && matchesStatus && matchesSearch && matchesWasteType && matchesCity;
    })
    .sort((a: any, b: any) => {
      let comparison = 0;
      switch (sortField) {
        case 'id':
          comparison = a.id - b.id;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'date':
          comparison = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
          break;
        case 'wasteType':
          comparison = (a.wasteType || '').localeCompare(b.wasteType || '');
          break;
        case 'location':
          comparison = (a.address || '').localeCompare(b.address || '');
          break;
        case 'value':
          const valueA = calculateWasteValue(a.wasteType, a.wasteAmount || 10);
          const valueB = calculateWasteValue(b.wasteType, b.wasteAmount || 10);
          comparison = valueA - valueB;
          break;
        default:
          comparison = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  
  const unassignedCount = collections.filter((c: any) => !c.collectorId && c.status === CollectionStatus.SCHEDULED).length;
  const myCollections = collections.filter((c: any) => c.collectorId === user.id);
  const collectionsCountByStatus = {
    confirmed: myCollections.filter((c: any) => c.status === CollectionStatus.CONFIRMED).length,
    in_progress: myCollections.filter((c: any) => c.status === CollectionStatus.IN_PROGRESS).length,
    completed: myCollections.filter((c: any) => c.status === CollectionStatus.COMPLETED).length,
    cancelled: myCollections.filter((c: any) => c.status === CollectionStatus.CANCELLED).length,
  };
  
  const totalPages = Math.ceil(filteredCollections.length / itemsPerPage);
  const paginatedCollections = filteredCollections.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [statusFilter, wasteTypeFilter, cityFilter, searchQuery]);

  const claimCollectionMutation = useMutation({
    mutationFn: async ({ collectionId, dropoffCenterId }: { collectionId: number; dropoffCenterId: number }) => {
      const checkRes = await apiRequest('GET', `/api/collections/${collectionId}`);
      const collection = await checkRes.json();
      
      if (collection.collectorId) {
        throw new Error('This collection has already been claimed by another collector');
      }
      
      const res = await apiRequest('PATCH', `/api/collections/${collectionId}`, {
        collectorId: user.id,
        status: CollectionStatus.CONFIRMED,
        dropoffCenterId,
        dropoffStatus: 'pending'
      });
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      toast({
        title: 'Collection claimed',
        description: 'You have successfully claimed this collection and assigned a drop-off center.',
      });
      setClaimDialogOpen(false);
      setClaimingCollection(null);
      setStatusFilter(CollectionStatus.CONFIRMED);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to claim collection',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const bulkClaimMutation = useMutation({
    mutationFn: async ({ collectionIds, dropoffCenterId }: { collectionIds: number[]; dropoffCenterId: number }) => {
      const res = await apiRequest('POST', '/api/collections/bulk-claim', { collectionIds, dropoffCenterId });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      setBulkClaimDialogOpen(false);
      setSelectedIds(new Set());
      toast({
        title: `${data.claimed} collection${data.claimed !== 1 ? 's' : ''} claimed`,
        description: data.failed > 0 
          ? `${data.failed} could not be claimed (already taken or unavailable).`
          : 'All selected collections have been claimed successfully.',
        variant: data.failed > 0 ? 'destructive' : 'default',
      });
      if (data.claimed > 0) {
        setStatusFilter(CollectionStatus.CONFIRMED);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Bulk claim failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const confirmDropoffMutation = useMutation({
    mutationFn: async ({ collectionId, dropoffCode }: { collectionId: number; dropoffCode: string }) => {
      const res = await apiRequest('POST', `/api/collections/${collectionId}/confirm-dropoff`, { dropoffCode });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to confirm delivery');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      setConfirmingDropoffId(null);
      setDropoffCodeInput('');
      toast({
        title: 'Delivery Confirmed',
        description: 'The drop-off has been confirmed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Confirmation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateCollectionStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes, wasteAmount, verificationCode }: { id: number; status: string; notes?: string; wasteAmount?: number; verificationCode?: string }) => {
      const updateData: any = { status };
      if (notes) updateData.notes = notes;
      if (wasteAmount && status === CollectionStatus.COMPLETED) updateData.wasteAmount = wasteAmount;
      if (verificationCode && status === CollectionStatus.COMPLETED) updateData.verificationCode = verificationCode;
      const res = await apiRequest('PATCH', `/api/collections/${id}`, updateData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update collection');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      setStatusUpdateModal(false);
      setSelectedCollection(null);
      setWasteAmount('');
      setNotesInput('');
      setVerificationCodeInput('');
      toast({
        title: 'Collection updated',
        description: 'The collection status has been updated successfully.',
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

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case CollectionStatus.SCHEDULED: return CollectionStatus.CONFIRMED;
      case CollectionStatus.CONFIRMED: return CollectionStatus.IN_PROGRESS;
      case CollectionStatus.PENDING: return CollectionStatus.CONFIRMED;
      case CollectionStatus.IN_PROGRESS: return CollectionStatus.COMPLETED;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case CollectionStatus.SCHEDULED: return 'bg-blue-100 text-blue-800 border-blue-200';
      case CollectionStatus.PENDING: return 'bg-amber-100 text-amber-800 border-amber-200';
      case CollectionStatus.CONFIRMED: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case CollectionStatus.IN_PROGRESS: return 'bg-purple-100 text-purple-800 border-purple-200';
      case CollectionStatus.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
      case CollectionStatus.CANCELLED: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const calculateWasteValue = (wasteType: string, estimatedAmount: number = 10) => {
    return getCollectorEarnings(wasteType, estimatedAmount);
  };

  const getActionButton = (collection: any) => {
    const nextStatus = getNextStatus(collection.status);
    
    if (!collection.collectorId && collection.status === CollectionStatus.SCHEDULED) {
      return (
        <Button 
          size="sm" 
          variant="default" 
          onClick={() => {
            setClaimingCollection(collection);
            setClaimDialogOpen(true);
          }}
        >
          <Truck className="mr-1.5 h-4 w-4" />
          Claim
        </Button>
      );
    }
    
    if (nextStatus && collection.collectorId === user.id) {
      return (
        <Button 
          size="sm" 
          variant={nextStatus === CollectionStatus.COMPLETED ? "default" : "outline"} 
          onClick={() => {
            setSelectedCollection(collection);
            setStatusUpdateModal(true);
          }}
        >
          {nextStatus === CollectionStatus.CONFIRMED && (
            <><CheckCircle className="mr-1.5 h-4 w-4" />Confirm</>
          )}
          {nextStatus === CollectionStatus.IN_PROGRESS && (
            <><Truck className="mr-1.5 h-4 w-4" />Start Pickup</>
          )}
          {nextStatus === CollectionStatus.COMPLETED && (
            <><CheckCheck className="mr-1.5 h-4 w-4" />Complete</>
          )}
        </Button>
      );
    }
    
    return null;
  };

  const formatAddress = (address: string) => {
    if (!address) return "No address provided";
    return address.length > 40 ? address.substring(0, 40) + "..." : address;
  };
  
  const getRequesterInfo = (userId: number) => {
    if (!users || !Array.isArray(users) || users.length === 0) return null;
    return users.find((u: any) => u.id === userId);
  };
  

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const unassignedOnPage = paginatedCollections.filter((c: any) => !c.collectorId && c.status === CollectionStatus.SCHEDULED);
    const allSelected = unassignedOnPage.every((c: any) => selectedIds.has(c.id));
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        unassignedOnPage.forEach((c: any) => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        unassignedOnPage.forEach((c: any) => next.add(c.id));
        return next;
      });
    }
  };

  const selectableOnPage = paginatedCollections.filter((c: any) => !c.collectorId && c.status === CollectionStatus.SCHEDULED);
  const allOnPageSelected = selectableOnPage.length > 0 && selectableOnPage.every((c: any) => selectedIds.has(c.id));
  const someOnPageSelected = selectableOnPage.some((c: any) => selectedIds.has(c.id));

  const selectedWasteType = selectedIds.size > 0 
    ? collections.find((c: any) => selectedIds.has(c.id))?.wasteType 
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto py-6 px-4 md:px-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Collection Management</h1>
            <p className="text-muted-foreground">
              Claim available pickups and manage your waste collections
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className={`hover:shadow-md transition-shadow cursor-pointer ${statusFilter === 'unassigned' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => setStatusFilter('unassigned')}>
              <CardContent className="p-4 flex flex-col items-center">
                <AlertTriangle className="h-5 w-5 mb-1 text-amber-500" />
                <p className="text-sm font-medium">Available</p>
                <p className="text-2xl font-bold">{unassignedCount}</p>
              </CardContent>
            </Card>
            
            <Card className={`hover:shadow-md transition-shadow cursor-pointer ${statusFilter === 'all' ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => setStatusFilter('all')}>
              <CardContent className="p-4 flex flex-col items-center">
                <Package className="h-5 w-5 mb-1 text-gray-500" />
                <p className="text-sm font-medium">All Mine</p>
                <p className="text-2xl font-bold">{myCollections.length}</p>
              </CardContent>
            </Card>
            
            <Card className={`hover:shadow-md transition-shadow cursor-pointer ${statusFilter === CollectionStatus.CONFIRMED ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => setStatusFilter(CollectionStatus.CONFIRMED)}>
              <CardContent className="p-4 flex flex-col items-center">
                <CheckCircle className="h-5 w-5 mb-1 text-indigo-500" />
                <p className="text-sm font-medium">Confirmed</p>
                <p className="text-2xl font-bold">{collectionsCountByStatus.confirmed}</p>
              </CardContent>
            </Card>
            
            <Card className={`hover:shadow-md transition-shadow cursor-pointer ${statusFilter === CollectionStatus.IN_PROGRESS ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => setStatusFilter(CollectionStatus.IN_PROGRESS)}>
              <CardContent className="p-4 flex flex-col items-center">
                <Truck className="h-5 w-5 mb-1 text-purple-500" />
                <p className="text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold">{collectionsCountByStatus.in_progress}</p>
              </CardContent>
            </Card>
            
            <Card className={`hover:shadow-md transition-shadow cursor-pointer ${statusFilter === CollectionStatus.COMPLETED ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => setStatusFilter(CollectionStatus.COMPLETED)}>
              <CardContent className="p-4 flex flex-col items-center">
                <CheckCheck className="h-5 w-5 mb-1 text-green-500" />
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold">{collectionsCountByStatus.completed}</p>
              </CardContent>
            </Card>
            
            <Card className={`hover:shadow-md transition-shadow cursor-pointer ${statusFilter === CollectionStatus.CANCELLED ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  onClick={() => setStatusFilter(CollectionStatus.CANCELLED)}>
              <CardContent className="p-4 flex flex-col items-center">
                <XCircle className="h-5 w-5 mb-1 text-red-500" />
                <p className="text-sm font-medium">Cancelled</p>
                <p className="text-2xl font-bold">{collectionsCountByStatus.cancelled}</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by address or waste type..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={wasteTypeFilter} onValueChange={setWasteTypeFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Waste type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(wasteTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {availableCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Available Pickups</SelectItem>
                <SelectItem value="all">All My Collections</SelectItem>
                <SelectItem value={CollectionStatus.CONFIRMED}>Confirmed</SelectItem>
                <SelectItem value={CollectionStatus.IN_PROGRESS}>In Progress</SelectItem>
                <SelectItem value={CollectionStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={CollectionStatus.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="collections">Collection Assignments</TabsTrigger>
              <TabsTrigger value="routes">Route Optimization</TabsTrigger>
            </TabsList>
            
            <TabsContent value="collections" className="mt-0">
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {isUnassignedView ? 'Available Pickups' : 'My Collections'}
                      </CardTitle>
                      <CardDescription>
                        {filteredCollections.length} {filteredCollections.length === 1 ? 'collection' : 'collections'}
                        {wasteTypeFilter !== 'all' ? ` · ${wasteTypeConfig[wasteTypeFilter as keyof typeof wasteTypeConfig]?.label || wasteTypeFilter}` : ''}
                        {cityFilter !== 'all' ? ` · ${cityFilter}` : ''}
                      </CardDescription>
                    </div>
                    {selectedIds.size > 0 && (
                      <Button
                        onClick={() => setBulkClaimDialogOpen(true)}
                        className="gap-2"
                      >
                        <Truck className="h-4 w-4" />
                        Claim Selected ({selectedIds.size})
                      </Button>
                    )}
                  </div>
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
                    {isUnassignedView 
                      ? "There are no available pickups to claim at the moment." 
                      : `No ${statusFilter !== 'all' ? statusFilter : ''} collections to display.`}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {isUnassignedView && (
                          <TableHead className="w-[40px]">
                            <Checkbox
                              checked={allOnPageSelected}
                              onCheckedChange={toggleSelectAll}
                              aria-label="Select all"
                            />
                          </TableHead>
                        )}
                        {isAllMineView && (
                          <TableHead>
                            <button onClick={() => handleSort('status')} className="flex items-center hover:text-primary">
                              Status{getSortIcon('status')}
                            </button>
                          </TableHead>
                        )}
                        <TableHead>
                          <button onClick={() => handleSort('wasteType')} className="flex items-center hover:text-primary">
                            Waste Type{getSortIcon('wasteType')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button onClick={() => handleSort('date')} className="flex items-center hover:text-primary">
                            Date{getSortIcon('date')}
                          </button>
                        </TableHead>
                        <TableHead>City</TableHead>
                        {!isUnassignedView && <TableHead>Drop-off</TableHead>}
                        <TableHead className="text-right">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCollections.map((collection: any) => {
                        const isSelectable = !collection.collectorId && collection.status === CollectionStatus.SCHEDULED;
                        const isSelected = selectedIds.has(collection.id);
                        
                        return (
                          <TableRow 
                            key={collection.id} 
                            className={`group hover:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''}`}
                          >
                            {isUnassignedView && (
                              <TableCell>
                                {isSelectable && (
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleSelection(collection.id)}
                                    aria-label={`Select collection #${collection.id}`}
                                  />
                                )}
                              </TableCell>
                            )}
                            {isAllMineView && (
                              <TableCell>
                                <Badge variant="outline" className={getStatusColor(collection.status)}>
                                  {collection.status.charAt(0).toUpperCase() + collection.status.slice(1)}
                                </Badge>
                              </TableCell>
                            )}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="capitalize">{collection.wasteType}</span>
                                {collection.wasteAmount && (
                                  <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                                    {formatNumber(collection.wasteAmount)} kg
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                {format(new Date(collection.scheduledDate), 'MMM d, yyyy')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{collection.city || '—'}</span>
                            </TableCell>
                            {!isUnassignedView && (
                              <TableCell>
                                {collection.dropoffCenterId ? (
                                  <div className="flex flex-col gap-1">
                                    {collection.dropoffConfirmed ? (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 w-fit">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Delivered
                                      </Badge>
                                    ) : confirmingDropoffId === collection.id ? (
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          value={dropoffCodeInput}
                                          onChange={(e) => setDropoffCodeInput(e.target.value.toUpperCase())}
                                          placeholder="Enter code"
                                          className="w-[100px] h-7 text-xs font-mono border rounded px-2 bg-background"
                                        />
                                        <Button
                                          size="sm"
                                          className="h-7 px-2"
                                          onClick={() => confirmDropoffMutation.mutate({ collectionId: collection.id, dropoffCode: dropoffCodeInput })}
                                          disabled={!dropoffCodeInput || confirmDropoffMutation.isPending}
                                        >
                                          {confirmDropoffMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 px-1" onClick={() => { setConfirmingDropoffId(null); setDropoffCodeInput(''); }}>
                                          <XCircle className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => setConfirmingDropoffId(collection.id)}
                                      >
                                        Confirm Delivery
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            )}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {!isUnassignedView && getActionButton(collection)}
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedCollection(collection);
                                    setNotesInput(collection.notes || '');
                                  }}
                                  title="View Collection Details"
                                >
                                  <Activity className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
                  {totalPages > 1 && (
                    <div className="flex justify-center py-4 space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
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
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="routes" className="mt-0">
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                  <CardTitle>Route Optimization</CardTitle>
                  <CardDescription>
                    Plan efficient routes for waste collection with automatic optimization
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <RouteOptimizationMap 
                    collections={Array.isArray(collections) ? collections : []} 
                    collectorAddress={user?.address || undefined}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
          </Tabs>
        </div>
      </main>
      
      {selectedCollection && !statusUpdateModal && (
        <Dialog open={!!selectedCollection} onOpenChange={(open) => !open && setSelectedCollection(null)}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Collection #{selectedCollection.id}</DialogTitle>
              <DialogDescription>
                Scheduled for {format(new Date(selectedCollection.scheduledDate), 'MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
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
                  <Badge variant="outline" className={getStatusColor(selectedCollection.status)}>
                    {selectedCollection.status.charAt(0).toUpperCase() + selectedCollection.status.slice(1)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Waste Type</Label>
                <div className="col-span-3">
                  <div className="flex flex-col">
                    <span className="capitalize">{selectedCollection.wasteType}</span>
                    {selectedCollection.wasteDescription && (
                      <span className="text-sm text-muted-foreground">
                        {selectedCollection.wasteDescription}
                      </span>
                    )}
                  </div>
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
                <Label className="text-right">Your Earnings</Label>
                <div className="col-span-3 flex items-center">
                  <CreditCard className="mr-2 h-4 w-4 text-green-500" />
                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 font-medium">
                    KSh {formatNumber(calculateWasteValue(selectedCollection.wasteType, selectedCollection.wasteAmount || 10))}
                  </Badge>
                </div>
              </div>
              
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
                    onClick={() => setStatusUpdateModal(true)}
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
                    <div className="col-span-3">
                      <Input
                        id="wasteAmount"
                        className="w-full"
                        type="number"
                        value={wasteAmount}
                        onChange={(e) => setWasteAmount(e.target.value)}
                        placeholder="Enter amount in kg"
                      />
                      {wasteAmount && (
                        <div className="mt-2 flex items-center text-sm">
                          <CreditCard className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-muted-foreground">Your earnings: </span>
                          <Badge className="ml-2 bg-green-50 text-green-800 border-green-200">
                            {formatNumber(calculateWasteValue(selectedCollection.wasteType, parseFloat(wasteAmount)))} KSh
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="verificationCode" className="text-right">
                      Verification Code
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="verificationCode"
                        className="w-full font-mono tracking-wider text-center text-lg"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={verificationCodeInput}
                        onChange={(e) => setVerificationCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit code from customer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Ask the customer for the code shown on their portal</p>
                    </div>
                  </div>
                </>
              )}
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right pt-2">Notes</Label>
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
              <Button variant="outline" onClick={() => setStatusUpdateModal(false)}>
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
                  if (nextStatus === CollectionStatus.COMPLETED && verificationCodeInput) {
                    data.verificationCode = verificationCodeInput;
                  }
                  updateCollectionStatusMutation.mutate(data);
                }}
                disabled={
                  updateCollectionStatusMutation.isPending || 
                  (getNextStatus(selectedCollection.status) === CollectionStatus.COMPLETED && (!wasteAmount || verificationCodeInput.length !== 6))
                }
              >
                {getNextStatus(selectedCollection.status) === CollectionStatus.COMPLETED ? 'Confirm Pickup' : 'Update Status'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {claimingCollection && (
        <ClaimPickupDialog
          open={claimDialogOpen}
          onOpenChange={(open) => {
            setClaimDialogOpen(open);
            if (!open) setClaimingCollection(null);
          }}
          wasteType={claimingCollection.wasteType}
          wasteAmount={claimingCollection.wasteAmount}
          onConfirm={(centerId) => {
            claimCollectionMutation.mutate({
              collectionId: claimingCollection.id,
              dropoffCenterId: centerId,
            });
          }}
          isPending={claimCollectionMutation.isPending}
        />
      )}

      {bulkClaimDialogOpen && (
        <ClaimPickupDialog
          open={bulkClaimDialogOpen}
          onOpenChange={setBulkClaimDialogOpen}
          wasteType={selectedWasteType || 'general'}
          onConfirm={(centerId) => {
            bulkClaimMutation.mutate({
              collectionIds: Array.from(selectedIds),
              dropoffCenterId: centerId,
            });
          }}
          isPending={bulkClaimMutation.isPending}
        />
      )}

      <Footer />
    </div>
  );
}
