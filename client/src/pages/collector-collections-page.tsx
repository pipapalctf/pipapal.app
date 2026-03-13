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
import { Calendar, CheckCircle, CheckCircle2, Clock, Filter, MapPin, Search, Truck, Package, AlertTriangle, Trash2, ClipboardCheck, ArrowRight, CalendarClock, CheckCheck, X, Map, XCircle, Activity, Scale, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Loader2, MoreHorizontal, Route, CreditCard, Navigation, Zap } from 'lucide-react';
import { isToday, isTomorrow, addDays, startOfDay, endOfDay } from 'date-fns';
import { formatNumber } from '@/lib/utils';
import { wasteTypeConfig } from '@/lib/types';
import { format } from 'date-fns';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';
import { Separator } from '@/components/ui/separator';
import { RouteOptimizationMap } from '@/components/maps/route-optimization-map';
import { PickupMap } from '@/components/maps/pickup-map';
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
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'week'>('week');
  
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
        (!collection.collectorId && (
          collection.status === CollectionStatus.SCHEDULED ||
          collection.status === CollectionStatus.PENDING
        ));
      
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
  
  const unassignedCount = collections.filter((c: any) => 
    !c.collectorId && (
      c.status === CollectionStatus.SCHEDULED ||
      c.status === CollectionStatus.PENDING
    )
  ).length;
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
    
    if (!collection.collectorId && (collection.status === CollectionStatus.SCHEDULED || collection.status === CollectionStatus.PENDING)) {
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
    const unassignedOnPage = paginatedCollections.filter((c: any) => !c.collectorId && (c.status === CollectionStatus.SCHEDULED || c.status === CollectionStatus.PENDING));
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

  const selectableOnPage = paginatedCollections.filter((c: any) => !c.collectorId && (c.status === CollectionStatus.SCHEDULED || c.status === CollectionStatus.PENDING));
  const allOnPageSelected = selectableOnPage.length > 0 && selectableOnPage.every((c: any) => selectedIds.has(c.id));
  const someOnPageSelected = selectableOnPage.some((c: any) => selectedIds.has(c.id));

  const selectedWasteType = selectedIds.size > 0 
    ? collections.find((c: any) => selectedIds.has(c.id))?.wasteType 
    : null;

  // ---- Available pickups new view helpers ----
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.fullName?.split(' ')[0] || user?.username?.split('_')[0] || 'there';

  const allAvailable = (collections as any[]).filter(
    (c) => !c.collectorId && (c.status === CollectionStatus.SCHEDULED || c.status === CollectionStatus.PENDING)
  );

  const dateFilteredAvailable = allAvailable.filter((c) => {
    const d = new Date(c.scheduledDate);
    if (dateFilter === 'today') return isToday(d);
    if (dateFilter === 'tomorrow') return isTomorrow(d);
    return d <= addDays(startOfDay(new Date()), 7);
  });

  const todayPickups = allAvailable.filter((c) => isToday(new Date(c.scheduledDate)));
  const estimatedTodayEarnings = todayPickups.reduce(
    (sum, c) => sum + calculateWasteValue(c.wasteType, c.wasteAmount || 10), 0
  );
  const estimatedAllEarnings = allAvailable.reduce(
    (sum, c) => sum + calculateWasteValue(c.wasteType, c.wasteAmount || 10), 0
  );

  // Location-filtered available pickups for map + card list
  const searchFilteredAvailable = useMemo(() => {
    if (!searchQuery) return dateFilteredAvailable;
    const q = searchQuery.toLowerCase();
    return dateFilteredAvailable.filter((c: any) =>
      (c.address || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.wasteType || '').toLowerCase().includes(q)
    );
  }, [dateFilteredAvailable, searchQuery]);

  // Closest-area suggestions when search returns no results
  const suggestionPickups = useMemo(() => {
    if (!searchQuery || searchFilteredAvailable.length > 0) return [];
    // Sort all by date urgency (soonest first)
    return [...dateFilteredAvailable].sort((a: any, b: any) =>
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    ).slice(0, 5);
  }, [searchQuery, searchFilteredAvailable, dateFilteredAvailable]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto py-6 px-4 md:px-6">
        <div className="flex flex-col gap-4">
          {/* Greeting banner — available view only */}
          {isUnassignedView ? (
            <div className="rounded-xl bg-green-600 text-white px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-lg leading-tight">{greeting}, {firstName}</p>
                <p className="text-green-100 text-sm mt-0.5">
                  {allAvailable.length} pickup{allAvailable.length !== 1 ? 's' : ''} available
                  {todayPickups.length > 0 && (
                    <> · <span className="font-medium">{todayPickups.length} due today</span></>
                  )}
                  {' · '}Est. <span className="font-semibold text-white">KSh {formatNumber(estimatedAllEarnings)}</span>
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0 bg-white text-green-700 hover:bg-green-50 gap-1.5"
                onClick={() => setActiveTab('routes')}
              >
                <Navigation className="h-4 w-4" />
                Start today's route
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold">Collection Management</h1>
              <p className="text-muted-foreground">Claim available pickups and manage your waste collections</p>
            </div>
          )}

          {/* Inline stat dots */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <button onClick={() => setStatusFilter('unassigned')} className={`flex items-center gap-1.5 ${statusFilter === 'unassigned' ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
              Available <span className="font-bold ml-0.5">{unassignedCount}</span>
            </button>
            <button onClick={() => setStatusFilter(CollectionStatus.IN_PROGRESS)} className={`flex items-center gap-1.5 ${statusFilter === CollectionStatus.IN_PROGRESS ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500 inline-block" />
              In progress <span className="font-bold ml-0.5">{collectionsCountByStatus.in_progress}</span>
            </button>
            <button onClick={() => setStatusFilter(CollectionStatus.CONFIRMED)} className={`flex items-center gap-1.5 ${statusFilter === CollectionStatus.CONFIRMED ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 inline-block" />
              Confirmed <span className="font-bold ml-0.5">{collectionsCountByStatus.confirmed}</span>
            </button>
            <button onClick={() => setStatusFilter(CollectionStatus.COMPLETED)} className={`flex items-center gap-1.5 ${statusFilter === CollectionStatus.COMPLETED ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />
              Completed <span className="font-bold ml-0.5">{collectionsCountByStatus.completed}</span>
            </button>
            <button onClick={() => setStatusFilter('all')} className={`flex items-center gap-1.5 ${statusFilter === 'all' ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
              <span className="h-2.5 w-2.5 rounded-full bg-gray-400 inline-block" />
              All mine <span className="font-bold ml-0.5">{myCollections.length}</span>
            </button>
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
              {isUnassignedView ? (
                /* ── NEW AVAILABLE PICKUPS LAYOUT ── */
                <div className="space-y-4">
                  {/* Date tabs + select all */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex bg-muted rounded-lg p-1 gap-1">
                      {(['today', 'tomorrow', 'week'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setDateFilter(f)}
                          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                            dateFilter === f
                              ? 'bg-background shadow-sm text-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {f === 'today' ? 'Today' : f === 'tomorrow' ? 'Tomorrow' : 'This week'}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedIds.size > 0 && (
                        <Button size="sm" onClick={() => setBulkClaimDialogOpen(true)} className="gap-1.5">
                          <Truck className="h-4 w-4" />
                          Claim ({selectedIds.size})
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const ids = new Set(searchFilteredAvailable.map((c: any) => c.id));
                          setSelectedIds(ids as Set<number>);
                        }}
                      >
                        Select all
                      </Button>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                      {/* Leaflet map */}
                      <div className="rounded-xl border overflow-hidden" style={{ height: 360 }}>
                        <PickupMap
                          collections={searchFilteredAvailable}
                          searchQuery={searchQuery}
                          onAccept={(c) => { setClaimingCollection(c); setClaimDialogOpen(true); }}
                          calculateEarnings={(wt, amt) => calculateWasteValue(wt, amt)}
                        />
                      </div>

                      {/* Collection cards */}
                      <div className="flex flex-col gap-1">
                        <p className="text-sm text-muted-foreground mb-1">
                          {searchFilteredAvailable.length} pickup{searchFilteredAvailable.length !== 1 ? 's' : ''}
                          {searchQuery
                            ? <> in <span className="font-medium text-foreground capitalize">{searchQuery}</span></>
                            : ' near you'}
                        </p>

                        {/* No results in searched area */}
                        {searchQuery && searchFilteredAvailable.length === 0 ? (
                          <div className="rounded-xl border bg-muted/30 p-6">
                            <div className="flex flex-col items-center text-center mb-4">
                              <MapPin className="h-10 w-10 text-muted-foreground mb-2" />
                              <p className="font-semibold">No pickups in "{searchQuery}"</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                No collections scheduled in this area yet.
                              </p>
                            </div>
                            {suggestionPickups.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                  Most urgent pickups nearby
                                </p>
                                <div className="space-y-2">
                                  {suggestionPickups.map((c: any) => {
                                    const dueToday = isToday(new Date(c.scheduledDate));
                                    const earnings = calculateWasteValue(c.wasteType, c.wasteAmount || 10);
                                    return (
                                      <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-background border p-3">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-xs font-semibold capitalize">{c.wasteType}</span>
                                            {c.wasteAmount && <span className="text-xs text-muted-foreground">{c.wasteAmount} kg</span>}
                                            {dueToday && <span className="text-xs text-red-500 font-medium">Due today</span>}
                                          </div>
                                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                                            {c.address?.split(',')[0] || c.city || '—'} · {format(new Date(c.scheduledDate), 'MMM d')}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="text-sm font-bold text-green-700">KSh {formatNumber(earnings)}</span>
                                          <Button size="sm" className="h-7 px-3 bg-green-600 hover:bg-green-700"
                                            onClick={() => { setClaimingCollection(c); setClaimDialogOpen(true); }}>
                                            Accept
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : dateFilteredAvailable.length === 0 ? (
                          <div className="rounded-xl border bg-muted/30 p-8 text-center">
                            <Package className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                            <p className="font-medium">No pickups for this period</p>
                            <p className="text-sm text-muted-foreground mt-1">Try "This week" to see more</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                            {searchFilteredAvailable.map((collection: any) => {
                              const dueToday = isToday(new Date(collection.scheduledDate));
                              const dueTomorrow = isTomorrow(new Date(collection.scheduledDate));
                              const earnings = calculateWasteValue(collection.wasteType, collection.wasteAmount || 10);
                              const location = collection.address?.split(',')[0]?.trim() || collection.city || '—';
                              const isSelected = selectedIds.has(collection.id);
                              const wtConfig = wasteTypeConfig[collection.wasteType as keyof typeof wasteTypeConfig];
                              return (
                                <div
                                  key={collection.id}
                                  className={`rounded-xl border p-4 transition-all ${isSelected ? 'border-green-500 bg-green-50/60 dark:bg-green-900/10' : 'bg-card hover:border-green-300'}`}
                                >
                                  {/* Top row */}
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span
                                        className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                                        style={{ background: wtConfig?.color + '20', color: wtConfig?.color || '#22c55e' }}
                                      >
                                        {collection.wasteType}
                                      </span>
                                      {collection.wasteAmount && (
                                        <Badge variant="outline" className="text-xs py-0 h-5">
                                          {formatNumber(collection.wasteAmount)} kg
                                        </Badge>
                                      )}
                                      {dueToday && (
                                        <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">Due today</span>
                                      )}
                                      {dueTomorrow && (
                                        <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Tomorrow</span>
                                      )}
                                    </div>
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => toggleSelection(collection.id)}
                                      className="mt-0.5"
                                    />
                                  </div>
                                  {/* Location + date */}
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(collection.scheduledDate), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                  {/* Earnings + accept */}
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-base font-bold text-green-700">KSh {formatNumber(earnings)}</p>
                                    </div>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 px-5"
                                      onClick={() => {
                                        setClaimingCollection(collection);
                                        setClaimDialogOpen(true);
                                      }}
                                    >
                                      Accept
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── EXISTING TABLE FOR MY COLLECTIONS ── */
                <Card className="overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>My Collections</CardTitle>
                        <CardDescription>
                          {filteredCollections.length} {filteredCollections.length === 1 ? 'collection' : 'collections'}
                          {wasteTypeFilter !== 'all' ? ` · ${wasteTypeConfig[wasteTypeFilter as keyof typeof wasteTypeConfig]?.label || wasteTypeFilter}` : ''}
                          {cityFilter !== 'all' ? ` · ${cityFilter}` : ''}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                      </div>
                    ) : filteredCollections.length === 0 ? (
                      <div className="p-6 text-center">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                        <h3 className="font-medium text-lg">No collections found</h3>
                        <p className="text-muted-foreground">
                          {`No ${statusFilter !== 'all' ? statusFilter : ''} collections to display.`}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
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
                              <TableHead>Drop-off</TableHead>
                              <TableHead className="text-right">Details</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedCollections.map((collection: any) => (
                              <TableRow key={collection.id} className="hover:bg-muted/50">
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
                                <TableCell>
                                  {collection.dropoffCenterId ? (
                                    <div className="flex flex-col gap-1">
                                      {collection.dropoffConfirmed ? (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 w-fit">
                                          <CheckCircle2 className="h-3 w-3 mr-1" />Delivered
                                        </Badge>
                                      ) : confirmingDropoffId === collection.id ? (
                                        <div className="flex items-center gap-1.5">
                                          <input
                                            value={dropoffCodeInput}
                                            onChange={(e) => setDropoffCodeInput(e.target.value.toUpperCase())}
                                            placeholder="Enter code"
                                            className="w-[100px] h-7 text-xs font-mono border rounded px-2 bg-background"
                                          />
                                          <Button size="sm" className="h-7 px-2"
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
                                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmingDropoffId(collection.id)}>
                                          Confirm Delivery
                                        </Button>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    {getActionButton(collection)}
                                    <Button size="sm" variant="outline"
                                      onClick={() => { setSelectedCollection(collection); setNotesInput(collection.notes || ''); }}
                                      title="View Details"
                                    >
                                      <Activity className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {totalPages > 1 && (
                          <div className="flex justify-center py-4 space-x-1">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <Button key={page} variant={page === currentPage ? 'default' : 'outline'} size="sm" className="w-8 h-8 p-0" onClick={() => setCurrentPage(page)}>
                                  {page}
                                </Button>
                              ))}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
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
