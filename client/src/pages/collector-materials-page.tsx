import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Recycle, Leaf, Package, Filter, MapPin, ArrowRight, Calendar, CircleDollarSign, 
  Truck, AlertCircle, CheckCircle2, Scale, Clock, Cpu, Apple, FlaskConical, 
  Banknote, History, Plus, Edit, Trash, Check, X 
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { 
  Collection,
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

export default function CollectorMaterialsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [filterMaterialType, setFilterMaterialType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('available');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialListing | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewBidsDialogOpen, setViewBidsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Create form schema for material listings
  const materialFormSchema = z.object({
    materialType: z.string().min(1, "Material type is required"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1 kg"),
    description: z.string().optional(),
    price: z.coerce.number().optional(),
    location: z.string().min(3, "Location is required"),
    collectionId: z.coerce.number().optional()
  });

  // Create form for material listings
  const materialForm = useForm<z.infer<typeof materialFormSchema>>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      materialType: 'plastic',
      quantity: 0,
      description: "",
      price: undefined,
      location: "",
      collectionId: undefined
    },
  });

  // Fetch user's completed collections for reference
  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ['/api/collections'],
  });

  // Filter to only completed collections with waste amount
  const completedCollections = collections.filter(
    collection => collection.status === 'completed' && collection.wasteAmount && collection.wasteAmount > 0
  );

  // Fetch material listings created by the collector
  const { data: materials = [], isLoading } = useQuery<MaterialListing[]>({
    queryKey: ['/api/materials/my-listings'],
  });

  // Fetch bids on selected material
  const { data: bids = [], refetch: refetchBids } = useQuery<MaterialBid[]>({
    queryKey: ['/api/materials', selectedMaterial?.id, 'bids'],
    enabled: !!selectedMaterial,
  });

  // Apply filters
  const filteredMaterials = materials.filter(material => {
    // Apply material type filter
    if (filterMaterialType !== 'all' && material.materialType !== filterMaterialType) {
      return false;
    }
    
    // Apply status filter
    if (filterStatus !== 'all' && material.status !== filterStatus) {
      return false;
    }
    
    return true;
  });

  // Create a new material listing
  const createMaterialMutation = useMutation({
    mutationFn: async (data: z.infer<typeof materialFormSchema>) => {
      const response = await apiRequest('POST', '/api/materials', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Material Listed Successfully",
        description: "Your material has been listed in the marketplace.",
        variant: "default",
      });
      setCreateDialogOpen(false);
      materialForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/materials/my-listings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to List Material",
        description: error.message || "There was an error listing your material. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update an existing material listing
  const updateMaterialMutation = useMutation({
    mutationFn: async (data: z.infer<typeof materialFormSchema> & { id: number }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest('PATCH', `/api/materials/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Material Updated",
        description: "Your material listing has been updated successfully.",
        variant: "default",
      });
      setCreateDialogOpen(false);
      setIsEditing(false);
      materialForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/materials/my-listings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Material",
        description: error.message || "There was an error updating your material listing. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Accept or reject a bid
  const updateBidMutation = useMutation({
    mutationFn: async ({ bidId, status }: { bidId: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/materials/bids/${bidId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid Updated",
        description: "The bid status has been updated successfully.",
        variant: "default",
      });
      refetchBids();
      queryClient.invalidateQueries({ queryKey: ['/api/materials/my-listings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Bid",
        description: error.message || "There was an error updating the bid. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const handleFormSubmit = (data: z.infer<typeof materialFormSchema>) => {
    if (isEditing && selectedMaterial) {
      updateMaterialMutation.mutate({ ...data, id: selectedMaterial.id });
    } else {
      createMaterialMutation.mutate(data);
    }
  };

  // Open the create dialog
  const handleCreateMaterial = () => {
    setIsEditing(false);
    materialForm.reset({
      materialType: 'plastic',
      quantity: 0,
      description: "",
      price: undefined,
      location: user?.address || "",
      collectionId: undefined
    });
    setCreateDialogOpen(true);
  };

  // Open the edit dialog
  const handleEditMaterial = (material: MaterialListing) => {
    setSelectedMaterial(material);
    setIsEditing(true);
    materialForm.reset({
      materialType: material.materialType,
      quantity: material.quantity,
      description: material.description || "",
      price: material.price || undefined,
      location: material.location,
      collectionId: material.collectionId
    });
    setCreateDialogOpen(true);
  };

  // View bids for a material
  const handleViewBids = (material: MaterialListing) => {
    setSelectedMaterial(material);
    setViewBidsDialogOpen(true);
    refetchBids();
  };

  // Handle bid acceptance/rejection
  const handleBidAction = (bidId: number, status: string) => {
    updateBidMutation.mutate({ bidId, status });
  };

  // Get waste type display name and icon
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Material Listings</h1>
              <p className="text-muted-foreground">
                Manage your recycling materials in the marketplace
              </p>
            </div>
            <Button 
              onClick={handleCreateMaterial} 
              className="bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Listing
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="active" className="mb-8">
            <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
              <TabsTrigger value="active" onClick={() => setFilterStatus('available')}>Active</TabsTrigger>
              <TabsTrigger value="pending" onClick={() => setFilterStatus('pending')}>Pending Bids</TabsTrigger>
              <TabsTrigger value="sold" onClick={() => setFilterStatus('sold')}>Sold</TabsTrigger>
            </TabsList>

            {/* Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Select
                  value={filterMaterialType}
                  onValueChange={setFilterMaterialType}
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

            <TabsContent value="active">
              {isLoading ? (
                <div className="py-12 text-center">
                  <div className="inline-block p-4 rounded-full bg-muted">
                    <Clock className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <p className="mt-4 text-lg font-medium">Loading your materials...</p>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <Card className="text-center p-12">
                  <CardContent>
                    <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">No Materials Listed</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      You don't have any active material listings. Create a new listing to sell your recycling materials.
                    </p>
                    <Button 
                      onClick={handleCreateMaterial}
                      className="mt-6"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Listing
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredMaterials.map((material: MaterialListing) => {
                    const typeInfo = getWasteTypeDisplay(material.materialType);
                    const pendingBids = bids.filter(bid => bid.materialId === material.id && bid.status === 'pending').length;
                    
                    return (
                      <Card key={material.id} className="overflow-hidden border shadow hover:shadow-md transition-shadow">
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
                              {material.status.charAt(0).toUpperCase() + material.status.slice(1)}
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
                            
                            <div className="flex items-center gap-1 text-blue-600">
                              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                {pendingBids} bid{pendingBids !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditMaterial(material)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewBids(material)}
                            >
                              View Bids
                            </Button>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => navigate(`/materials/${material.id}`)}
                          >
                            Details
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending">
              {/* Similar content as active tab but filtered for pending items */}
              {isLoading ? (
                <div className="py-12 text-center">
                  <div className="inline-block p-4 rounded-full bg-muted">
                    <Clock className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <p className="mt-4 text-lg font-medium">Loading pending bids...</p>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <Card className="text-center p-12">
                  <CardContent>
                    <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                      <History className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">No Pending Bids</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      You don't have any materials with pending bids. When recyclers place bids on your materials, they will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {/* Material cards similar to active tab */}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sold">
              {/* Similar content as active tab but filtered for sold items */}
              {isLoading ? (
                <div className="py-12 text-center">
                  <div className="inline-block p-4 rounded-full bg-muted">
                    <Clock className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <p className="mt-4 text-lg font-medium">Loading sold materials...</p>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <Card className="text-center p-12">
                  <CardContent>
                    <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">No Sold Materials</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      You haven't sold any materials yet. Once you accept bids, your sold materials will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {/* Material cards similar to active tab */}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Create/Edit Material Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Material Listing' : 'New Material Listing'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update your material listing in the marketplace' 
                : 'Create a new material listing to sell in the marketplace'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...materialForm}>
            <form onSubmit={materialForm.handleSubmit(handleFormSubmit)} className="space-y-4">
              {completedCollections.length > 0 && (
                <FormField
                  control={materialForm.control}
                  name="collectionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Collection (Optional)</FormLabel>
                      <Select
                        value={field.value?.toString() || ''}
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a collection" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {completedCollections.map((collection) => (
                            <SelectItem key={collection.id} value={collection.id.toString()}>
                              {collection.wasteType} - {formatNumber(collection.wasteAmount || 0)}kg
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Link this listing to a completed collection (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={materialForm.control}
                name="materialType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a material type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(WasteType).map(type => (
                          <SelectItem key={type} value={WasteType[type as keyof typeof WasteType]}>
                            {type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={materialForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter quantity in kg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={materialForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter pickup location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={materialForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fixed Price (KES, Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Leave empty for bidding" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : undefined;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty to accept bids, or set a fixed price
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={materialForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide details about the material"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createMaterialMutation.isPending || updateMaterialMutation.isPending}
                >
                  {(createMaterialMutation.isPending || updateMaterialMutation.isPending) ? (
                    <>
                      <span className="mr-2">Saving</span>
                      <Clock className="h-4 w-4 animate-spin" />
                    </>
                  ) : isEditing ? 'Update Material' : 'Create Listing'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Bids Dialog */}
      <Dialog open={viewBidsDialogOpen} onOpenChange={setViewBidsDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Bids for {selectedMaterial?.materialType} Material</DialogTitle>
            <DialogDescription>
              Review and respond to bids from recyclers
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {bids.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <History className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Bids Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto text-sm">
                  This material hasn't received any bids yet. Check back later.
                </p>
              </div>
            ) : (
              bids.map((bid) => (
                <Card key={bid.id} className="overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base font-medium">
                        KES {formatNumber(bid.amount, 2)}
                      </CardTitle>
                      <Badge
                        className={
                          bid.status === 'accepted' ? 'bg-green-100 text-green-800 border-green-200' : 
                          bid.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' : 
                          'bg-blue-100 text-blue-800 border-blue-200'
                        }
                      >
                        {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      Bid placed on {new Date(bid.createdAt).toLocaleDateString()} at {new Date(bid.createdAt).toLocaleTimeString()}
                    </CardDescription>
                  </CardHeader>
                  
                  {bid.message && (
                    <CardContent className="py-2">
                      <p className="text-sm">{bid.message}</p>
                    </CardContent>
                  )}
                  
                  {bid.status === 'pending' && (
                    <CardFooter className="flex justify-end gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleBidAction(bid.id, 'rejected')}
                        disabled={updateBidMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleBidAction(bid.id, 'accepted')}
                        disabled={updateBidMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setViewBidsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}