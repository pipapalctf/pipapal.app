import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Recycle, Leaf, Package, Filter, MapPin, ArrowRight, Calendar, CircleDollarSign, Truck, 
  AlertCircle, CheckCircle2, Scale, Clock, Cpu, Apple, FlaskConical, Banknote, History } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { 
  MaterialListing,
  MaterialBid,
  MaterialStatus,
  WasteType,
  UserRole
} from '@shared/schema';
import { formatNumber } from '@/lib/utils';
import { wasteTypeConfig } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from 'wouter';
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

export default function RecyclerMaterialsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [filterWasteType, setFilterWasteType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('available');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialListing | null>(null);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);

  // Create a form for placing bids
  const bidFormSchema = z.object({
    amount: z.coerce.number().min(1, "Bid amount must be at least 1"),
    message: z.string().optional(),
  });

  const bidForm = useForm<z.infer<typeof bidFormSchema>>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      amount: 0,
      message: "",
    },
  });

  // Fetch available materials
  const { data: materials = [], isLoading } = useQuery<MaterialListing[]>({
    queryKey: ['/api/materials/available'],
  });

  // Fetch user's own bids
  const { data: myBids = [] } = useQuery<MaterialBid[]>({
    queryKey: ['/api/materials/bids/my-bids'],
  });

  // Apply waste type filter
  const filteredByWasteType = filterWasteType === 'all' 
    ? materials 
    : materials.filter((material) => material.materialType === filterWasteType);

  // Group materials by waste type for easier viewing
  const groupedMaterials = filteredByWasteType.reduce((groups: Record<string, MaterialListing[]>, material) => {
    const materialType = material.materialType || 'general';
    if (!groups[materialType]) {
      groups[materialType] = [];
    }
    groups[materialType].push(material);
    return groups;
  }, {} as Record<string, MaterialListing[]>);

  // Calculate total materials available
  const totalMaterials = materials.reduce(
    (total: number, material) => total + material.quantity,
    0
  );

  // Calculate materials by type for the summary cards
  const materialsByType = materials.reduce((acc: Record<string, number>, material) => {
    const materialType = material.materialType || 'general';
    if (!acc[materialType]) {
      acc[materialType] = 0;
    }
    acc[materialType] += material.quantity;
    return acc;
  }, {});

  // Calculate active bids 
  const activeBidsCount = myBids.filter(bid => bid.status === 'pending').length;

  // Place bid mutation
  const placeBidMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bidFormSchema>) => {
      if (!selectedMaterial) return null;
      const response = await apiRequest('POST', `/api/materials/${selectedMaterial.id}/bids`, {
        amount: data.amount,
        message: data.message || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid Placed Successfully",
        description: "Your bid has been recorded. You'll be notified when the collector responds.",
        variant: "default",
      });
      setBidDialogOpen(false);
      bidForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/materials/bids/my-bids'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Place Bid",
        description: error.message || "There was an error placing your bid. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle placing a bid
  const handleBid = (material: MaterialListing) => {
    setSelectedMaterial(material);
    bidForm.setValue('amount', Math.round(material.quantity * 5)); // Suggest a default price
    setBidDialogOpen(true);
  };

  // Get waste type display name and color
  const getWasteTypeDisplay = (type: string) => {
    const config = wasteTypeConfig[type as keyof typeof wasteTypeConfig] || wasteTypeConfig.general;
    
    // Extract color from the textColor class
    const getColorFromClass = (colorClass: string): string => {
      const colorMap: Record<string, string> = {
        'text-primary': '#2ECC71',
        'text-blue-600': '#3182CE',
        'text-yellow-600': '#D69E2E',
        'text-green-600': '#38A169',
        'text-green-700': '#2F855A',
        'text-gray-600': '#4B5563',
        'text-purple-600': '#805AD5',
        'text-red-600': '#E53E3E',
        'text-orange-600': '#DD6B20',
        'text-indigo-600': '#5A67D8'
      };
      
      return colorMap[colorClass] || '#6B7280';
    };
    
    // Map icon strings to Lucide React components
    const getIconComponent = (iconName: string) => {
      switch(iconName) {
        case 'trash': return <Package className="h-4 w-4" />;
        case 'recycle': return <Recycle className="h-4 w-4" />;
        case 'file': return <Package className="h-4 w-4" />;
        case 'wine-glass': return <Package className="h-4 w-4" />;
        case 'shopping-bag': return <Package className="h-4 w-4" />;
        case 'cpu': return <Cpu className="h-4 w-4" />;
        case 'apple': return <Apple className="h-4 w-4" />;
        case 'flask': return <FlaskConical className="h-4 w-4" />;
        case 'package': return <Package className="h-4 w-4" />;
        default: return <Package className="h-4 w-4" />;
      }
    };
    
    return {
      name: config.label || type.charAt(0).toUpperCase() + type.slice(1),
      color: getColorFromClass(config.textColor),
      icon: getIconComponent(config.icon)
    };
  };

  // Calculate estimated CO2 offset
  const estimatedCO2Offset = totalMaterials * 2; // 2kg CO2 per kg of recycled material

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Available Materials</h1>
            <p className="text-muted-foreground">
              Browse and acquire materials ready for recycling
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="overflow-hidden border-0 shadow-md">
              <div className="h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Available Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-green-100 mr-3">
                    <Scale className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold">{formatNumber(totalMaterials)} kg</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-0 shadow-md">
              <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Material Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-blue-100 mr-3">
                    <Recycle className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold">{Object.keys(materialsByType).length}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-0 shadow-md">
              <div className="h-2 bg-gradient-to-r from-teal-400 to-teal-600"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Potential CO₂ Offset</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-teal-100 mr-3">
                    <Leaf className="h-5 w-5 text-teal-600" />
                  </div>
                  <span className="text-2xl font-bold">{formatNumber(estimatedCO2Offset)} kg</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border-0 shadow-md">
              <div className="h-2 bg-gradient-to-r from-amber-400 to-amber-600"></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-amber-100 mr-3">
                    <CircleDollarSign className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-2xl font-bold">${formatNumber(totalMaterials * 0.2, 2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Select
                value={filterWasteType}
                onValueChange={setFilterWasteType}
              >
                <SelectTrigger className="w-full md:w-64">
                  <span className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by material type" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Materials</SelectItem>
                  {Object.keys(WasteType).map(type => (
                    <SelectItem key={type} value={WasteType[type as keyof typeof WasteType]}>
                      {type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block p-4 rounded-full bg-muted">
                <Clock className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="mt-4 text-lg font-medium">Loading available materials...</p>
            </div>
          ) : filteredByWasteType.length === 0 ? (
            <Card className="text-center p-12">
              <CardContent>
                <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium mb-2">No Materials Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  There are currently no completed collections with materials available for recycling.
                  Check back later or adjust your filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedMaterials).map(([materialType, materials]) => {
                const typeInfo = getWasteTypeDisplay(materialType);
                
                return (
                  <div key={materialType} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-full" style={{ backgroundColor: `${typeInfo.color}25` }}>
                        <div className="p-1 rounded-full" style={{ color: typeInfo.color }}>
                          {typeInfo.icon}
                        </div>
                      </div>
                      <h2 className="text-xl font-semibold">{typeInfo.name} Materials</h2>
                      <Badge variant="outline" className="ml-2">
                        {materials.length} {materials.length === 1 ? 'item' : 'items'}
                      </Badge>
                    </div>
                    
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {materials.map((material: MaterialListing) => (
                        <Card key={material.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                          <div className="h-2" style={{ backgroundColor: typeInfo.color }}></div>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg font-medium">
                                {formatNumber(material.quantity)} kg
                              </CardTitle>
                              <Badge className="ml-2" style={{ 
                                backgroundColor: `${typeInfo.color}20`, 
                                color: typeInfo.color,
                                border: `1px solid ${typeInfo.color}40`
                              }}>
                                {typeInfo.name}
                              </Badge>
                            </div>
                            <CardDescription className="flex items-center justify-between">
                              <span>Listed on {new Date(material.createdAt).toLocaleDateString()}</span>
                              <Badge variant="outline" className="ml-auto text-xs bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Available
                              </Badge>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm">{material.location}</span>
                            </div>
                            
                            {material.description && (
                              <div className="flex items-start gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                <span>{material.description}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mt-2 text-sm">
                              {material.price ? (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <CircleDollarSign className="h-4 w-4" />
                                  <span>KES {formatNumber(material.price, 2)} listed</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Banknote className="h-4 w-4" />
                                  <span>Open for bidding</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Leaf className="h-4 w-4" />
                                <span>{formatNumber(material.quantity * 2)} kg CO₂ offset</span>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between pt-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => navigate(`/materials/${material.id}`)}
                            >
                              View Details
                            </Button>
                            <Button
                              onClick={() => handleBid(material)}
                              className="flex items-center gap-1"
                              disabled={placeBidMutation.isPending}
                            >
                              {placeBidMutation.isPending && selectedMaterial?.id === material.id ? (
                                <>
                                  <span className="animate-pulse">Processing</span>
                                  <Clock className="h-4 w-4 ml-1 animate-spin" />
                                </>
                              ) : (
                                <>
                                  Place Bid
                                  <ArrowRight className="h-4 w-4 ml-1" />
                                </>
                              )}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Bid Dialog */}
          <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Place Bid</DialogTitle>
                <DialogDescription>
                  Enter your bid amount and any message for the collector.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...bidForm}>
                <form onSubmit={bidForm.handleSubmit(data => placeBidMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={bidForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bid Amount (KES)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter amount" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the amount you're willing to pay for this material.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={bidForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional details or terms"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Include any terms or details about your bid.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setBidDialogOpen(false)}
                      className="mt-4"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={placeBidMutation.isPending}
                      className="mt-4"
                    >
                      {placeBidMutation.isPending ? (
                        <>
                          <span className="mr-2">Submitting</span>
                          <Clock className="h-4 w-4 animate-spin" />
                        </>
                      ) : 'Submit Bid'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}