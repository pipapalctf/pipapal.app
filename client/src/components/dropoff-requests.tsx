import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Inbox, Star, Phone, Mail, Building2, Award, ChevronDown, ChevronUp, User, MapPin, Settings, Plus, Trash2, CheckCircle, Package, Copy } from "lucide-react";
import { format } from "date-fns";
import { wasteTypeConfig } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

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
    <div className="py-2 px-3 bg-muted/30 rounded-lg space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <User className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">{collectorName || "Collector"}</span>
        {details.isCertified && (
          <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
            <Award className="h-3 w-3 mr-0.5" />
            Certified
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {details.businessName && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span>{details.businessName}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Star className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
          {details.ratingCount > 0 ? (
            <span>
              <span className="text-foreground font-medium">{details.rating}</span>/5
              <span className="text-xs ml-1">({details.ratingCount} {details.ratingCount === 1 ? "review" : "reviews"})</span>
            </span>
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

  const removeLimit = (index: number) => {
    setLimits(limits.filter((_, i) => i !== index));
  };

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

  const handleTurnOff = () => {
    saveMutation.mutate([]);
  };

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
          <Button size="sm" onClick={addLimit}>
            <Plus className="h-4 w-4 mr-1" />
            Add Waste Type
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {limits.map((limit, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-card">
              <Select value={limit.wasteType} onValueChange={(v) => updateLimit(index, 'wasteType', v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
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
                className="w-[100px]"
                min="1"
                placeholder="kg"
              />
              <span className="text-sm text-muted-foreground">kg</span>

              <Select value={limit.period} onValueChange={(v) => updateLimit(index, 'period', v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
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
              <Plus className="h-4 w-4 mr-1" />
              Add Another Type
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

  const getWasteConfig = (type: string) => {
    return wasteTypeConfig[type as keyof typeof wasteTypeConfig] || wasteTypeConfig.general;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading drop-off requests...</span>
        </CardContent>
      </Card>
    );
  }

  const unconfirmedDropoffs = dropoffs.filter(d => !d.dropoffConfirmed);
  const confirmedDropoffs = dropoffs.filter(d => d.dropoffConfirmed);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Incoming Drop-offs
            {unconfirmedDropoffs.length > 0 && (
              <Badge variant="secondary" className="ml-1">{unconfirmedDropoffs.length} pending</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Waste drop-offs assigned to you by collectors
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAccepting && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(true)}
            >
              <Settings className="h-4 w-4 mr-1.5" />
              Configure Limits
            </Button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {isAccepting ? "Accepting Waste" : "Not Accepting"}
            </span>
            <Switch
              checked={isAccepting}
              onCheckedChange={handleToggleAccepting}
              disabled={isToggling}
            />
          </div>
        </div>
      </div>

      {limits.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {limits.map((limit) => {
            const config = getWasteConfig(limit.wasteType);
            const remaining = limit.limitAmount - (limit.currentUsed || 0);
            const percentage = Math.min(((limit.currentUsed || 0) / limit.limitAmount) * 100, 100);
            return (
              <Card key={limit.wasteType} className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${config.bgColor} ${config.textColor} border-0 text-xs`}>
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground capitalize">{limit.period}</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">{Math.max(0, remaining).toLocaleString()}</span>
                  <span className="text-muted-foreground"> / {limit.limitAmount.toLocaleString()} kg</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {dropoffs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No drop-offs yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isAccepting
                ? "When collectors assign you for waste drop-off, they will appear here."
                : "Configure your acceptance limits to start receiving drop-offs from collectors."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {unconfirmedDropoffs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Awaiting Delivery</h3>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waste Type</TableHead>
                      <TableHead>Collector</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Pickup Location</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Drop-off Code</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unconfirmedDropoffs.map((dropoff) => {
                      const config = getWasteConfig(dropoff.wasteType);
                      const isExpanded = expandedCollectors.has(dropoff.id);
                      return (
                        <>
                          <TableRow key={dropoff.id}>
                            <TableCell>
                              <Badge className={`${config.bgColor} ${config.textColor} border-0`}>
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">{dropoff.collectorName || "Unknown"}</span>
                                {dropoff.collectorDetails && (
                                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 p-0 h-auto font-normal text-xs justify-start" onClick={() => toggleCollectorDetails(dropoff.id)}>
                                    {isExpanded ? <><ChevronUp className="h-3 w-3 mr-1" />Hide Details</> : <><ChevronDown className="h-3 w-3 mr-1" />View Details</>}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{dropoff.wasteAmount ? `${dropoff.wasteAmount} kg` : "TBD"}</TableCell>
                            <TableCell>
                              <span className="text-sm truncate max-w-[200px] block">{dropoff.address}</span>
                            </TableCell>
                            <TableCell>
                              {dropoff.scheduledDate ? format(new Date(dropoff.scheduledDate), "MMM d, yyyy") : "N/A"}
                            </TableCell>
                            <TableCell>
                              {dropoff.dropoffCode ? (
                                <div className="flex items-center gap-1.5">
                                  <code className="text-sm font-mono font-bold bg-primary/10 text-primary px-2 py-1 rounded">{dropoff.dropoffCode}</code>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyCode(dropoff.dropoffCode!)}>
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                dropoff.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                                dropoff.status === "in_progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                "bg-yellow-50 text-yellow-700 border-yellow-200"
                              }>
                                {dropoff.status === "in_progress" ? "In Progress" :
                                 dropoff.status === "completed" ? "Collected" :
                                 dropoff.status === "confirmed" ? "Confirmed" : dropoff.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                          {isExpanded && dropoff.collectorDetails && (
                            <TableRow key={`${dropoff.id}-details`}>
                              <TableCell colSpan={7} className="p-2">
                                <CollectorDetailsPanel details={dropoff.collectorDetails} collectorName={dropoff.collectorName} />
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground">
                Share the drop-off code with the collector when they arrive. They will enter it to confirm delivery.
              </p>
            </div>
          )}

          {confirmedDropoffs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Confirmed Deliveries</h3>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waste Type</TableHead>
                      <TableHead>Collector</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmedDropoffs.slice(0, 10).map((dropoff) => {
                      const config = getWasteConfig(dropoff.wasteType);
                      return (
                        <TableRow key={dropoff.id}>
                          <TableCell>
                            <Badge className={`${config.bgColor} ${config.textColor} border-0`}>
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{dropoff.collectorName || "Unknown"}</TableCell>
                          <TableCell>{dropoff.wasteAmount ? `${dropoff.wasteAmount} kg` : "TBD"}</TableCell>
                          <TableCell>
                            <span className="text-sm truncate max-w-[200px] block">{dropoff.address}</span>
                          </TableCell>
                          <TableCell>{dropoff.scheduledDate ? format(new Date(dropoff.scheduledDate), "MMM d, yyyy") : "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Delivered
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}

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
