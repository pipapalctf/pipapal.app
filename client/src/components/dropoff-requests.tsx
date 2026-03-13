import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Inbox, Star, Phone, Mail, Building2, Award, ChevronDown, ChevronUp, User, MapPin, Settings, Plus, Trash2, CheckCircle, Package, Copy, Calendar, Truck, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { wasteTypeConfig } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { wastePricingConfig } from "@shared/schema";

interface CollectorDetails {
  email: string;
  phone: string | null;
  businessName: string | null;
  serviceLocation: string | null;
  isCertified: boolean;
  rating: number;
  ratingCount: number;
}

interface DropoffCollection {
  id: number;
  wasteType: string;
  wasteAmount: number | null;
  status: string;
  scheduledDate: string;
  address: string;
  city: string | null;
  dropoffCenterId: number;
  dropoffStatus: string | null;
  dropoffCode: string | null;
  dropoffConfirmed: boolean | null;
  collectorName: string | null;
  householdName: string | null;
  recyclerName: string | null;
  collectorDetails: CollectorDetails | null;
}

interface AcceptanceLimit {
  id?: number;
  wasteType: string;
  limitAmount: number;
  currentUsed: number;
  period: string;
}

const WASTE_TYPES = ['plastic', 'paper', 'glass', 'metal', 'organic', 'electronic', 'hazardous', 'cardboard', 'general'];
const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

function CollectorDetailsPanel({ details, collectorName }: { details: CollectorDetails; collectorName: string | null }) {
  return (
    <div className="mt-2 p-3 bg-muted/40 rounded-lg space-y-2 border">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">{collectorName || "Collector"}</span>
        {details.isCertified && (
          <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
            <Award className="h-3 w-3 mr-0.5" />Certified
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
        {details.businessName && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span>{details.businessName}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Star className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
          {details.ratingCount > 0 ? (
            <span><span className="text-foreground font-medium">{details.rating}</span>/5 <span className="text-xs">({details.ratingCount} review{details.ratingCount !== 1 ? 's' : ''})</span></span>
          ) : (
            <span className="text-xs">No ratings yet</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Mail className="h-3.5 w-3.5 shrink-0 text-primary/70" />
          <a href={`mailto:${details.email}`} className="text-primary hover:underline truncate">{details.email}</a>
        </div>
        {details.phone && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <a href={`tel:${details.phone}`} className="text-primary hover:underline">{details.phone}</a>
          </div>
        )}
        {details.serviceLocation && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span>Serves: {details.serviceLocation}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AcceptanceLimitsConfig({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [limits, setLimits] = useState<Array<{ wasteType: string; limitAmount: string; period: string }>>([]);

  const { data: existingLimits = [], isLoading } = useQuery<AcceptanceLimit[]>({
    queryKey: ['/api/waste-acceptance-limits', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/waste-acceptance-limits/${user?.id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (existingLimits.length > 0) {
      setLimits(existingLimits.map(l => ({
        wasteType: l.wasteType,
        limitAmount: l.limitAmount.toString(),
        period: l.period,
      })));
    }
  }, [existingLimits]);

  const saveMutation = useMutation({
    mutationFn: async (data: Array<{ wasteType: string; limitAmount: number; period: string }>) => {
      const res = await apiRequest("PUT", "/api/waste-acceptance-limits", { limits: data });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/waste-acceptance-limits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({ title: "Acceptance limits saved", description: "Collectors can now see your waste capacity." });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to save", description: "Please try again.", variant: "destructive" });
    },
  });

  const addLimit = () => {
    const usedTypes = limits.map(l => l.wasteType);
    const availableType = WASTE_TYPES.find(t => !usedTypes.includes(t));
    if (availableType) {
      setLimits([...limits, { wasteType: availableType, limitAmount: '1000', period: 'monthly' }]);
    }
  };

  const removeLimit = (index: number) => setLimits(limits.filter((_, i) => i !== index));

  const updateLimit = (index: number, field: string, value: string) => {
    const updated = [...limits];
    updated[index] = { ...updated[index], [field]: value };
    setLimits(updated);
  };

  const handleSave = () => {
    const valid = limits.filter(l => l.wasteType && parseFloat(l.limitAmount) > 0 && l.period);
    saveMutation.mutate(valid.map(l => ({
      wasteType: l.wasteType,
      limitAmount: parseFloat(l.limitAmount),
      period: l.period,
    })));
  };

  const handleTurnOff = () => saveMutation.mutate([]);
  const usedTypes = limits.map(l => l.wasteType);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Set how much of each waste type you can accept and how often. Collectors will see your remaining capacity.
      </p>
      {limits.length === 0 ? (
        <div className="text-center py-6 border rounded-lg bg-muted/20">
          <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">No waste types configured yet</p>
          <Button size="sm" onClick={addLimit}><Plus className="h-4 w-4 mr-1" />Add Waste Type</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {limits.map((limit, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-card">
              <Select value={limit.wasteType} onValueChange={(v) => updateLimit(index, 'wasteType', v)}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WASTE_TYPES.filter(t => t === limit.wasteType || !usedTypes.includes(t)).map(t => (
                    <SelectItem key={t} value={t}>
                      {wasteTypeConfig[t as keyof typeof wasteTypeConfig]?.label || t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={limit.limitAmount}
                onChange={(e) => updateLimit(index, 'limitAmount', e.target.value)}
                className="w-[100px]" min="1" placeholder="kg"
              />
              <span className="text-sm text-muted-foreground">kg</span>
              <Select value={limit.period} onValueChange={(v) => updateLimit(index, 'period', v)}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIODS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => removeLimit(index)} className="shrink-0 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {limits.length < WASTE_TYPES.length && (
            <Button variant="outline" size="sm" onClick={addLimit}>
              <Plus className="h-4 w-4 mr-1" />Add Another Type
            </Button>
          )}
        </div>
      )}
      <div className="flex justify-between pt-2">
        {existingLimits.length > 0 && (
          <Button variant="outline" onClick={handleTurnOff} disabled={saveMutation.isPending} className="text-destructive border-destructive/30">
            Stop Accepting
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending || limits.length === 0}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Save Limits
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  if (status === 'completed' || status === 'collected')
    return <Badge className="bg-green-100 text-green-800 border-green-200 gap-1"><CheckCircle className="h-3 w-3" />Collected</Badge>;
  if (status === 'in_progress')
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200 gap-1"><Truck className="h-3 w-3" />In Progress</Badge>;
  if (status === 'confirmed')
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1"><Clock className="h-3 w-3" />Confirmed</Badge>;
  return <Badge className="bg-gray-100 text-gray-700 border-gray-200 gap-1"><AlertCircle className="h-3 w-3" />{status}</Badge>;
}

export function DropoffRequests() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [expandedCollectors, setExpandedCollectors] = useState<Set<number>>(new Set());
  const [showConfig, setShowConfig] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const isAccepting = user?.acceptingWaste !== false;

  const handleToggleAccepting = async (checked: boolean) => {
    if (checked) {
      setShowConfig(true);
    } else {
      setIsToggling(true);
      try {
        await apiRequest("PATCH", "/api/recycler/accepting-waste", { acceptingWaste: false });
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        toast({ title: "Waste acceptance turned off", description: "Collectors will no longer see you as available." });
      } catch {
        toast({ title: "Failed to update", description: "Please try again.", variant: "destructive" });
      } finally {
        setIsToggling(false);
      }
    }
  };

  const toggleCollectorDetails = (id: number) => {
    setExpandedCollectors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copied", description: `Drop-off code ${code} copied to clipboard.` });
  };

  const { data: dropoffs = [], isLoading } = useQuery<DropoffCollection[]>({
    queryKey: ["/api/dropoffs"],
    refetchInterval: 30000,
  });

  const { data: limits = [] } = useQuery<AcceptanceLimit[]>({
    queryKey: ['/api/waste-acceptance-limits', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/waste-acceptance-limits/${user?.id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const getWasteConfig = (type: string) =>
    wasteTypeConfig[type as keyof typeof wasteTypeConfig] || wasteTypeConfig.general;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading drop-offs...</span>
        </CardContent>
      </Card>
    );
  }

  const pendingDropoffs = dropoffs.filter(d => !d.dropoffConfirmed);
  const confirmedDropoffs = dropoffs.filter(d => d.dropoffConfirmed);

  const totalPendingKg = pendingDropoffs.reduce((s, d) => s + (d.wasteAmount || 0), 0);
  const totalConfirmedKg = confirmedDropoffs.reduce((s, d) => s + (d.wasteAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Incoming Drop-offs
            {pendingDropoffs.length > 0 && (
              <Badge className="ml-1 bg-amber-100 text-amber-800 border-amber-200">
                {pendingDropoffs.length} pending
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Waste drop-offs assigned to you by collectors</p>
        </div>
        <div className="flex items-center gap-3">
          {isAccepting && (
            <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
              <Settings className="h-4 w-4 mr-1.5" />Configure Limits
            </Button>
          )}
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
            <span className="text-sm font-medium text-muted-foreground">
              {isAccepting ? "Accepting Waste" : "Not Accepting"}
            </span>
            <Switch checked={isAccepting} onCheckedChange={handleToggleAccepting} disabled={isToggling} />
          </div>
        </div>
      </div>

      {/* ── Capacity bars ── */}
      {limits.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {limits.map((limit) => {
            const config = getWasteConfig(limit.wasteType);
            const remaining = limit.limitAmount - (limit.currentUsed || 0);
            const pct = Math.min(((limit.currentUsed || 0) / limit.limitAmount) * 100, 100);
            return (
              <Card key={limit.wasteType} className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${config.bgColor} ${config.textColor} border-0 text-xs`}>{config.label}</Badge>
                  <span className="text-xs text-muted-foreground capitalize">{limit.period}</span>
                </div>
                <p className="text-sm">
                  <span className="font-semibold">{Math.max(0, remaining).toLocaleString()}</span>
                  <span className="text-muted-foreground"> / {limit.limitAmount.toLocaleString()} kg</span>
                </p>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Summary stat dots ── */}
      {dropoffs.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="text-muted-foreground">Awaiting</span>
            <span className="font-bold">{pendingDropoffs.length}</span>
            {totalPendingKg > 0 && <span className="text-muted-foreground text-xs">· {totalPendingKg} kg</span>}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />
            <span className="text-muted-foreground">Delivered</span>
            <span className="font-bold">{confirmedDropoffs.length}</span>
            {totalConfirmedKg > 0 && <span className="text-muted-foreground text-xs">· {totalConfirmedKg} kg</span>}
          </span>
        </div>
      )}

      {/* ── Tabs ── */}
      {dropoffs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-lg mb-1">No drop-offs yet</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              {isAccepting
                ? "When collectors assign you for waste drop-off, they'll appear here."
                : "Configure your acceptance limits to start receiving drop-offs from collectors."}
            </p>
            {!isAccepting && (
              <Button className="mt-4" onClick={() => setShowConfig(true)}>
                <Settings className="h-4 w-4 mr-1.5" />Configure Limits
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="awaiting">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="awaiting" className="flex-1 sm:flex-none gap-2">
              Awaiting Delivery
              {pendingDropoffs.length > 0 && (
                <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {pendingDropoffs.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="flex-1 sm:flex-none gap-2">
              Confirmed
              {confirmedDropoffs.length > 0 && (
                <span className="bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {confirmedDropoffs.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Awaiting Delivery ── */}
          <TabsContent value="awaiting" className="mt-4">
            {pendingDropoffs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm text-muted-foreground mt-1">No deliveries waiting.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingDropoffs.map((dropoff) => {
                  const config = getWasteConfig(dropoff.wasteType);
                  const isExpanded = expandedCollectors.has(dropoff.id);
                  return (
                    <Card key={dropoff.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        {/* Row 1: waste type + status */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={`${config.bgColor} ${config.textColor} border-0`}>
                              {config.label}
                            </Badge>
                            {dropoff.wasteAmount ? (
                              <span className="text-sm font-semibold">{dropoff.wasteAmount} kg</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Amount TBD</span>
                            )}
                          </div>
                          <StatusChip status={dropoff.status} />
                        </div>

                        {/* Row 2: collector + location + date */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm mb-3">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <User className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-medium text-foreground truncate">
                              {dropoff.collectorName || "Unknown collector"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{dropoff.address?.split(',')[0] || dropoff.city || '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            {dropoff.scheduledDate ? format(new Date(dropoff.scheduledDate), "MMM d, yyyy") : "N/A"}
                          </div>
                        </div>

                        {/* Row 3: drop-off code + expand collector */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          {dropoff.dropoffCode ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Drop-off code:</span>
                              <code className="text-sm font-mono font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg tracking-wider">
                                {dropoff.dropoffCode}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => copyCode(dropoff.dropoffCode!)}
                                title="Copy code"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Code will appear when collector is en route
                            </span>
                          )}

                          {dropoff.collectorDetails && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary h-7 text-xs px-2"
                              onClick={() => toggleCollectorDetails(dropoff.id)}
                            >
                              {isExpanded
                                ? <><ChevronUp className="h-3 w-3 mr-1" />Hide collector</>
                                : <><ChevronDown className="h-3 w-3 mr-1" />View collector</>}
                            </Button>
                          )}
                        </div>

                        {/* Expanded collector details */}
                        {isExpanded && dropoff.collectorDetails && (
                          <CollectorDetailsPanel details={dropoff.collectorDetails} collectorName={dropoff.collectorName} />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                <p className="text-xs text-muted-foreground pt-1">
                  Share the drop-off code with the collector when they arrive — they enter it to confirm delivery.
                </p>
              </div>
            )}
          </TabsContent>

          {/* ── Confirmed Deliveries ── */}
          <TabsContent value="confirmed" className="mt-4">
            {confirmedDropoffs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-medium">No confirmed deliveries yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Confirmed drop-offs will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {confirmedDropoffs.map((dropoff) => {
                  const config = getWasteConfig(dropoff.wasteType);
                  const pricing = wastePricingConfig[dropoff.wasteType];
                  const kg = dropoff.wasteAmount || 0;
                  const amountDue = pricing && pricing.recyclerRate > 0 && kg > 0
                    ? pricing.recyclerRate * kg
                    : null;
                  return (
                    <Card key={dropoff.id} className="overflow-hidden border-green-100">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={`${config.bgColor} ${config.textColor} border-0`}>
                              {config.label}
                            </Badge>
                            {kg > 0 ? (
                              <span className="text-sm font-semibold">{kg} kg</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {amountDue !== null && (
                              <span className="text-sm font-bold text-red-600">
                                -KSh {amountDue.toLocaleString()}
                              </span>
                            )}
                            <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
                              <CheckCircle className="h-3 w-3" />Delivered
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-medium text-foreground">{dropoff.collectorName || "Unknown"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{dropoff.address?.split(',')[0] || dropoff.city || '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            {dropoff.scheduledDate ? format(new Date(dropoff.scheduledDate), "MMM d, yyyy") : "N/A"}
                          </div>
                        </div>
                        {amountDue !== null && pricing && (
                          <p className="text-xs text-muted-foreground mt-2">
                            KSh {pricing.recyclerRate}/kg · deducted from wallet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* ── Configure Limits Dialog ── */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure Waste Acceptance</DialogTitle>
            <DialogDescription>
              Set the types and amounts of waste you can accept. Collectors will see your available capacity.
            </DialogDescription>
          </DialogHeader>
          <AcceptanceLimitsConfig onClose={() => setShowConfig(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
