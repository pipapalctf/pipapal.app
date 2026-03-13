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
import {
  Calendar, CheckCircle, CheckCircle2, Clock, MapPin, Search, Truck, Package,
  AlertTriangle, Trash2, ClipboardCheck, ArrowRight, CalendarClock, CheckCheck,
  X, Map, XCircle, Activity, Scale, ChevronLeft, ChevronRight, ChevronUp,
  ChevronDown, Loader2, MoreHorizontal, Route, CreditCard, Navigation, Filter
} from 'lucide-react';
import { formatNumber, cn } from '@/lib/utils';
import { wasteTypeConfig } from '@/lib/types';
import { format, isToday, isTomorrow, startOfWeek, endOfWeek, isWithinInterval, addDays } from 'date-fns';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/footer';
import { Separator } from '@/components/ui/separator';
import { RouteOptimizationMap } from '@/components/maps/route-optimization-map';
import { useLocation } from 'wouter';
import { ClaimPickupDialog } from '@/components/claim-pickup-dialog';

type TimeFilter = 'today' | 'tomorrow' | 'week';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getFirstName(user: any) {
  if (!user) return '';
  if (user.fullName) return user.fullName.split(' ')[0];
  return user.username?.split('_')[0] || '';
}

const WASTE_EMOJI: Record<string, string> = {
  plastic: '♻️', paper: '📄', metal: '🔩', electronic: '💻',
  glass: '🫙', cardboard: '📦', organic: '🌿', general: '🗑️', hazardous: '⚠️',
};

const WASTE_COLORS: Record<string, string> = {
  plastic: 'bg-blue-100 text-blue-700',
  paper: 'bg-yellow-100 text-yellow-700',
  metal: 'bg-gray-100 text-gray-700',
  electronic: 'bg-purple-100 text-purple-700',
  glass: 'bg-cyan-100 text-cyan-700',
  cardboard: 'bg-amber-100 text-amber-700',
  organic: 'bg-green-100 text-green-700',
  general: 'bg-slate-100 text-slate-700',
  hazardous: 'bg-red-100 text-red-700',
};

export default function CollectorCollectionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [myPickupsExpanded, setMyPickupsExpanded] = useState(false);
  const [routeTab, setRouteTab] = useState(false);

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
  const [searchQuery, setSearchQuery] = useState('');
  const [wasteTypeFilter, setWasteTypeFilter] = useState('all');

  const { data: users = [] } = useQuery({ queryKey: ['/api/users'], enabled: !!user });

  if (user?.role !== UserRole.COLLECTOR) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>This page is only available to collectors.</p>
      </div>
    );
  }

  const { data: collections = [], isLoading } = useQuery({ queryKey: ['/api/collections'] });

  const calculateWasteValue = (wasteType: string, amount: number = 10) =>
    getCollectorEarnings(wasteType, amount);

  const myCollections: any[] = (collections as any[]).filter((c: any) => c.collectorId === user.id);
  const unassignedCollections: any[] = (collections as any[]).filter(
    (c: any) => !c.collectorId && c.status === CollectionStatus.SCHEDULED
  );

  const collectionsCountByStatus = {
    confirmed: myCollections.filter((c) => c.status === CollectionStatus.CONFIRMED).length,
    in_progress: myCollections.filter((c) => c.status === CollectionStatus.IN_PROGRESS).length,
    completed: myCollections.filter((c) => c.status === CollectionStatus.COMPLETED).length,
    cancelled: myCollections.filter((c) => c.status === CollectionStatus.CANCELLED).length,
  };

  const now = new Date();
  const todayPickups = unassignedCollections.filter((c) => isToday(new Date(c.scheduledDate)));
  const todayEarnings = todayPickups.reduce(
    (sum, c) => sum + calculateWasteValue(c.wasteType, c.wasteAmount || 10), 0
  );

  const timeFilteredPickups = useMemo(() => {
    const base = searchQuery
      ? unassignedCollections.filter(
          (c) =>
            c.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.wasteType?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : unassignedCollections;

    const typed = wasteTypeFilter !== 'all'
      ? base.filter((c) => c.wasteType === wasteTypeFilter)
      : base;

    return typed.filter((c) => {
      const d = new Date(c.scheduledDate);
      if (timeFilter === 'today') return isToday(d);
      if (timeFilter === 'tomorrow') return isTomorrow(d);
      const weekEnd = addDays(now, 7);
      return d >= now && d <= weekEnd;
    });
  }, [collections, timeFilter, searchQuery, wasteTypeFilter]);

  const claimCollectionMutation = useMutation({
    mutationFn: async ({ collectionId, dropoffCenterId }: { collectionId: number; dropoffCenterId: number }) => {
      const checkRes = await apiRequest('GET', `/api/collections/${collectionId}`);
      const collection = await checkRes.json();
      if (collection.collectorId) throw new Error('This collection has already been claimed by another collector');
      const res = await apiRequest('PATCH', `/api/collections/${collectionId}`, {
        collectorId: user.id,
        status: CollectionStatus.CONFIRMED,
        dropoffCenterId,
        dropoffStatus: 'pending',
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      toast({ title: 'Collection claimed', description: 'You have successfully claimed this collection.' });
      setClaimDialogOpen(false);
      setClaimingCollection(null);
      setMyPickupsExpanded(true);
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to claim collection', description: error.message, variant: 'destructive' });
    },
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
        description: data.failed > 0 ? `${data.failed} could not be claimed.` : 'All claimed successfully.',
        variant: data.failed > 0 ? 'destructive' : 'default',
      });
      if (data.claimed > 0) setMyPickupsExpanded(true);
    },
    onError: (error: Error) => {
      toast({ title: 'Bulk claim failed', description: error.message, variant: 'destructive' });
    },
  });

  const confirmDropoffMutation = useMutation({
    mutationFn: async ({ collectionId, dropoffCode }: { collectionId: number; dropoffCode: string }) => {
      const res = await apiRequest('POST', `/api/collections/${collectionId}/confirm-dropoff`, { dropoffCode });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to confirm delivery'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      setConfirmingDropoffId(null);
      setDropoffCodeInput('');
      toast({ title: 'Delivery Confirmed', description: 'The drop-off has been confirmed successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Confirmation Failed', description: error.message, variant: 'destructive' });
    },
  });

  const updateCollectionStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes, wasteAmount, verificationCode }: any) => {
      const updateData: any = { status };
      if (notes) updateData.notes = notes;
      if (wasteAmount && status === CollectionStatus.COMPLETED) updateData.wasteAmount = wasteAmount;
      if (verificationCode && status === CollectionStatus.COMPLETED) updateData.verificationCode = verificationCode;
      const res = await apiRequest('PATCH', `/api/collections/${id}`, updateData);
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to update collection'); }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      setStatusUpdateModal(false);
      setSelectedCollection(null);
      setWasteAmount('');
      setNotesInput('');
      setVerificationCodeInput('');
      toast({ title: 'Collection updated', description: 'Status updated successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update collection', description: error.message, variant: 'destructive' });
    },
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
      case CollectionStatus.CONFIRMED: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case CollectionStatus.IN_PROGRESS: return 'bg-purple-100 text-purple-800 border-purple-200';
      case CollectionStatus.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
      case CollectionStatus.CANCELLED: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRequesterInfo = (userId: number) => {
    if (!users || !Array.isArray(users) || users.length === 0) return null;
    return (users as any[]).find((u: any) => u.id === userId);
  };

  const selectedWasteType = selectedIds.size > 0
    ? (collections as any[]).find((c: any) => selectedIds.has(c.id))?.wasteType
    : null;

  const primaryCity = useMemo(() => {
    const cities = unassignedCollections.map((c) => {
      if (c.address) return c.address.split(',').pop()?.trim();
      return null;
    }).filter(Boolean);
    if (cities.length === 0) return 'Nearby area';
    const freq: Record<string, number> = {};
    cities.forEach((c) => { freq[c!] = (freq[c!] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
  }, [collections]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <main className="flex-grow container mx-auto py-4 px-4 max-w-5xl">
        {/* ── Greeting header ─────────────────────────────── */}
        <div className="bg-green-600 text-white rounded-2xl p-5 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Good {getGreeting()}, {getFirstName(user)}</h1>
            <p className="text-green-100 text-sm mt-0.5">
              {todayPickups.length} pickup{todayPickups.length !== 1 ? 's' : ''} available today
              {todayEarnings > 0 && ` · Est. KSh ${formatNumber(todayEarnings)}`}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setRouteTab(true)}
            className="shrink-0 bg-white text-green-700 border-white hover:bg-green-50 gap-2"
          >
            <Navigation className="h-4 w-4" />
            Start today's route
          </Button>
        </div>

        {/* ── Stats bar ───────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl px-5 py-3 mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 border border-border">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-sm">Available <strong>{unassignedCollections.length}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-sm">In progress <strong>{collectionsCountByStatus.in_progress}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-sm">Confirmed <strong>{collectionsCountByStatus.confirmed}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            <span className="text-sm">Completed <strong>{collectionsCountByStatus.completed}</strong></span>
          </div>
        </div>

        {/* ── Route map (shown when "Start today's route" clicked) ── */}
        {routeTab && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl mb-4 overflow-hidden border border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="font-semibold">Route Optimization</h2>
              <Button size="sm" variant="ghost" onClick={() => setRouteTab(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <RouteOptimizationMap
                collections={Array.isArray(collections) ? collections : []}
                collectorAddress={user?.address || undefined}
              />
            </div>
          </div>
        )}

        {/* ── Main two-column ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Left: mini map */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-border">
            <div className="px-4 py-3 border-b text-sm text-muted-foreground font-medium">
              {primaryCity} · {unassignedCollections.length} available
            </div>
            <div className="h-[380px]">
              <RouteOptimizationMap
                collections={Array.isArray(collections) ? unassignedCollections : []}
                collectorAddress={user?.address || undefined}
              />
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 px-4 py-2 border-t text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" />Due today</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" />Available</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" />Confirmed</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500" />Cluster</span>
            </div>
          </div>

          {/* Right: pickup list */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border flex flex-col overflow-hidden">
            {/* Time filter tabs */}
            <div className="flex gap-1 p-3 border-b">
              {(['today', 'tomorrow', 'week'] as TimeFilter[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeFilter(t)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                    timeFilter === t
                      ? 'bg-gray-100 dark:bg-gray-800 text-foreground'
                      : 'text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  )}
                >
                  {t === 'today' ? 'Today' : t === 'tomorrow' ? 'Tomorrow' : 'This week'}
                </button>
              ))}
            </div>

            {/* Search + filter row */}
            <div className="flex gap-2 px-3 pt-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8 h-8 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={wasteTypeFilter} onValueChange={setWasteTypeFilter}>
                <SelectTrigger className="w-[110px] h-8 text-sm">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.entries(wasteTypeConfig).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{(v as any).label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Count + select all */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-muted-foreground">
                {timeFilteredPickups.length} pickup{timeFilteredPickups.length !== 1 ? 's' : ''} near you
              </span>
              {timeFilteredPickups.some((c: any) => !c.collectorId) && (
                <button
                  type="button"
                  onClick={() => {
                    const ids = new Set(timeFilteredPickups.map((c: any) => c.id));
                    setSelectedIds(ids);
                  }}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Select all
                </button>
              )}
            </div>

            {/* Pickup cards */}
            <div className="overflow-y-auto flex-1 max-h-[320px] px-3 pb-3 space-y-2">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : timeFilteredPickups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Package className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  No pickups for {timeFilter === 'week' ? 'this week' : timeFilter}
                </div>
              ) : (
                timeFilteredPickups.map((c: any) => {
                  const earnings = calculateWasteValue(c.wasteType, c.wasteAmount || 10);
                  const dueToday = isToday(new Date(c.scheduledDate));
                  const city = c.address?.split(',').slice(-2, -1)[0]?.trim() ||
                               c.address?.split(',')[0]?.trim() || '—';
                  const isSelected = selectedIds.has(c.id);

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        const next = new Set(selectedIds);
                        if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                        setSelectedIds(next);
                      }}
                      className={cn(
                        'rounded-xl border-2 p-3 cursor-pointer transition-all',
                        isSelected
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-border hover:border-green-300 bg-background'
                      )}
                    >
                      {/* Row 1: badges */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full capitalize', WASTE_COLORS[c.wasteType] || 'bg-gray-100 text-gray-700')}>
                          {WASTE_EMOJI[c.wasteType] || ''} {c.wasteType}
                        </span>
                        {c.wasteAmount && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                            {c.wasteAmount} kg
                          </span>
                        )}
                        {dueToday && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium">
                            Due today
                          </span>
                        )}
                      </div>

                      {/* Row 2: location + date */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(c.scheduledDate), 'MMM d, yyyy')}
                        </span>
                      </div>

                      {/* Row 3: earnings + accept */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">
                          KSh {formatNumber(earnings)}
                        </span>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setClaimingCollection(c);
                            setClaimDialogOpen(true);
                          }}
                          className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bulk claim bar */}
            {selectedIds.size > 0 && (
              <div className="border-t px-3 py-2 flex items-center justify-between bg-green-50 dark:bg-green-900/20">
                <span className="text-sm font-medium">{selectedIds.size} selected</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="h-7 text-xs">
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setBulkClaimDialogOpen(true)}
                    className="h-7 text-xs bg-green-600 hover:bg-green-700 gap-1"
                  >
                    <Truck className="h-3 w-3" />
                    Claim all ({selectedIds.size})
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── My accepted pickups (collapsible) ───────────── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setMyPickupsExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
          >
            <span className="font-semibold text-base">My accepted pickups</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {collectionsCountByStatus.in_progress > 0 && `${collectionsCountByStatus.in_progress} in progress`}
                {collectionsCountByStatus.in_progress > 0 && collectionsCountByStatus.confirmed > 0 && ' · '}
                {collectionsCountByStatus.confirmed > 0 && `${collectionsCountByStatus.confirmed} confirmed`}
              </span>
              {myPickupsExpanded
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </button>

          {myPickupsExpanded && (
            <div className="border-t">
              {myCollections.filter(
                (c) => c.status === CollectionStatus.IN_PROGRESS || c.status === CollectionStatus.CONFIRMED
              ).length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No active accepted pickups
                </div>
              ) : (
                <div className="divide-y">
                  {myCollections
                    .filter(
                      (c) =>
                        c.status === CollectionStatus.IN_PROGRESS ||
                        c.status === CollectionStatus.CONFIRMED
                    )
                    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                    .map((c: any) => {
                      const earnings = calculateWasteValue(c.wasteType, c.wasteAmount || 10);
                      const nextStatus = getNextStatus(c.status);
                      return (
                        <div key={c.id} className="flex items-center justify-between px-5 py-3 gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full capitalize', WASTE_COLORS[c.wasteType] || 'bg-gray-100 text-gray-700')}>
                                {WASTE_EMOJI[c.wasteType] || ''} {c.wasteType}
                              </span>
                              <Badge variant="outline" className={cn('text-xs', getStatusColor(c.status))}>
                                {c.status === CollectionStatus.IN_PROGRESS ? 'In Progress' : 'Confirmed'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {c.address?.split(',')[0]?.trim() || '—'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(c.scheduledDate), 'MMM d')}
                              </span>
                              <span className="font-semibold text-foreground">KSh {formatNumber(earnings)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {/* Dropoff confirm */}
                            {c.dropoffCenterId && !c.dropoffConfirmed && (
                              confirmingDropoffId === c.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    value={dropoffCodeInput}
                                    onChange={(e) => setDropoffCodeInput(e.target.value.toUpperCase())}
                                    placeholder="Code"
                                    className="w-20 h-7 text-xs font-mono border rounded px-2 bg-background"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <Button
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={(e) => { e.stopPropagation(); confirmDropoffMutation.mutate({ collectionId: c.id, dropoffCode: dropoffCodeInput }); }}
                                    disabled={!dropoffCodeInput || confirmDropoffMutation.isPending}
                                  >
                                    {confirmDropoffMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 px-1" onClick={() => { setConfirmingDropoffId(null); setDropoffCodeInput(''); }}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmingDropoffId(c.id)}>
                                  Confirm dropoff
                                </Button>
                              )
                            )}
                            {nextStatus && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => { setSelectedCollection(c); setNotesInput(c.notes || ''); setStatusUpdateModal(true); }}
                              >
                                {nextStatus === CollectionStatus.IN_PROGRESS ? 'Start' : 'Complete'}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => { setSelectedCollection(c); setNotesInput(c.notes || ''); }}
                            >
                              <Activity className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Collection details dialog ────────────────────── */}
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
                      const req = getRequesterInfo(selectedCollection.userId);
                      if (!req) return <span className="text-muted-foreground text-sm">User info unavailable</span>;
                      return (
                        <div className="flex flex-col gap-1">
                          <div className="font-medium">{req.fullName || req.username}</div>
                          {req.email && <div className="text-sm text-muted-foreground">{req.email}</div>}
                          {req.phone && <div className="text-sm text-muted-foreground">{req.phone}</div>}
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
                <div className="col-span-3 capitalize">{selectedCollection.wasteType}</div>
              </div>
              {selectedCollection.wasteAmount && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Amount</Label>
                  <div className="col-span-3">{formatNumber(selectedCollection.wasteAmount)} kg</div>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Your Earnings</Label>
                <div className="col-span-3">
                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 font-medium">
                    KSh {formatNumber(calculateWasteValue(selectedCollection.wasteType, selectedCollection.wasteAmount || 10))}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Address</Label>
                <div className="col-span-3 flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{selectedCollection.address}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Notes</Label>
                <Textarea
                  className="col-span-3"
                  placeholder="Add notes..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={() => { setSelectedCollection(null); setNotesInput(''); }}>Close</Button>
              <div className="flex gap-2">
                {selectedCollection.notes !== notesInput && (
                  <Button
                    onClick={() => updateCollectionStatusMutation.mutate({ id: selectedCollection.id, status: selectedCollection.status, notes: notesInput })}
                    disabled={updateCollectionStatusMutation.isPending}
                  >
                    Save Notes
                  </Button>
                )}
                {getNextStatus(selectedCollection.status) && selectedCollection.collectorId === user.id && (
                  <Button onClick={() => setStatusUpdateModal(true)}>Update Status</Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Status update dialog ─────────────────────────── */}
      {selectedCollection && (
        <Dialog open={statusUpdateModal} onOpenChange={setStatusUpdateModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Update Collection Status</DialogTitle>
              <DialogDescription>
                Change from <span className="font-medium capitalize">{selectedCollection.status}</span> to{' '}
                <span className="font-medium capitalize">{getNextStatus(selectedCollection.status)}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {getNextStatus(selectedCollection.status) === CollectionStatus.COMPLETED && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="wasteAmount" className="text-right">Amount (kg)</Label>
                    <div className="col-span-3">
                      <Input
                        id="wasteAmount"
                        type="number"
                        value={wasteAmount}
                        onChange={(e) => setWasteAmount(e.target.value)}
                        placeholder="Enter kg"
                      />
                      {wasteAmount && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Earnings: <span className="font-semibold text-green-600">KSh {formatNumber(calculateWasteValue(selectedCollection.wasteType, parseFloat(wasteAmount)))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="verificationCode" className="text-right">Code</Label>
                    <div className="col-span-3">
                      <Input
                        id="verificationCode"
                        className="font-mono tracking-wider text-center text-lg"
                        inputMode="numeric"
                        maxLength={6}
                        value={verificationCodeInput}
                        onChange={(e) => setVerificationCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit customer code"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Ask the customer for the code on their portal</p>
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
                  placeholder="Notes about this update..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusUpdateModal(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  const nextStatus = getNextStatus(selectedCollection.status);
                  if (!nextStatus) return;
                  const data: any = { id: selectedCollection.id, status: nextStatus, notes: notesInput };
                  if (nextStatus === CollectionStatus.COMPLETED && wasteAmount) data.wasteAmount = parseFloat(wasteAmount);
                  if (nextStatus === CollectionStatus.COMPLETED && verificationCodeInput) data.verificationCode = verificationCodeInput;
                  updateCollectionStatusMutation.mutate(data);
                }}
                disabled={
                  updateCollectionStatusMutation.isPending ||
                  (getNextStatus(selectedCollection.status) === CollectionStatus.COMPLETED &&
                    (!wasteAmount || verificationCodeInput.length !== 6))
                }
              >
                {getNextStatus(selectedCollection.status) === CollectionStatus.COMPLETED ? 'Confirm Pickup' : 'Update Status'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Claim dialog ─────────────────────────────────── */}
      {claimingCollection && (
        <ClaimPickupDialog
          open={claimDialogOpen}
          onOpenChange={(open) => { setClaimDialogOpen(open); if (!open) setClaimingCollection(null); }}
          wasteType={claimingCollection.wasteType}
          wasteAmount={claimingCollection.wasteAmount}
          onConfirm={(centerId) => claimCollectionMutation.mutate({ collectionId: claimingCollection.id, dropoffCenterId: centerId })}
          isPending={claimCollectionMutation.isPending}
        />
      )}

      {bulkClaimDialogOpen && (
        <ClaimPickupDialog
          open={bulkClaimDialogOpen}
          onOpenChange={setBulkClaimDialogOpen}
          wasteType={selectedWasteType || 'general'}
          onConfirm={(centerId) => bulkClaimMutation.mutate({ collectionIds: Array.from(selectedIds), dropoffCenterId: centerId })}
          isPending={bulkClaimMutation.isPending}
        />
      )}

      <Footer />
    </div>
  );
}
