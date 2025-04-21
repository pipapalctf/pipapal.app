import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  MaterialListing,
  MaterialBid,
  UserRole
} from '@shared/schema';
import { formatNumber } from '@/lib/utils';
import { wasteTypeConfig } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Edit,
  History,
  Leaf,
  MapPin,
  MessageSquare,
  PackageCheck,
  Recycle,
  Truck,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";

export default function MaterialDetailsPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const materialId = parseInt(params.id);
  
  // Form schema for placing bids
  const bidFormSchema = z.object({
    amount: z.coerce.number().min(1, "Bid amount must be at least 1"),
    message: z.string().optional(),
  });

  // Initialize form
  const bidForm = useForm<z.infer<typeof bidFormSchema>>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      amount: 0,
      message: "",
    },
  });

  // Fetch material details
  const { data: material, isLoading } = useQuery<MaterialListing>({
    queryKey: ['/api/materials', materialId],
    enabled: !isNaN(materialId),
  });

  // Fetch bids on this material
  const { data: bids = [] } = useQuery<MaterialBid[]>({
    queryKey: ['/api/materials', materialId, 'bids'],
    enabled: !isNaN(materialId) && !!material,
  });

  // Fetch user's own bids on this material
  const { data: myBids = [] } = useQuery<MaterialBid[]>({
    queryKey: ['/api/materials/bids/my-bids', materialId],
    enabled: !isNaN(materialId) && !!user && user.role === UserRole.RECYCLER,
  });

  // Check if user has already bid on this material
  const hasPlacedBid = myBids.some(bid => bid.materialId === materialId);

  // Place bid mutation
  const placeBidMutation = useMutation({
    mutationFn: async (data: z.infer<typeof bidFormSchema>) => {
      const response = await apiRequest('POST', `/api/materials/${materialId}/bids`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/materials', materialId, 'bids'] });
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
  const handleBid = () => {
    if (!material) return;
    
    bidForm.setValue('amount', Math.round(material.quantity * 5)); // Suggest a default price
    setBidDialogOpen(true);
  };

  // Get waste type display info
  const getWasteTypeDisplay = (type?: string) => {
    if (!type) return { name: 'General', color: '#6B7280', icon: <Recycle className="h-5 w-5" /> };
    
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
    
    return {
      name: config.label || type.charAt(0).toUpperCase() + type.slice(1),
      color: getColorFromClass(config.textColor)
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto animate-spin text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Loading material details...</h2>
          </div>
        </main>
        <MobileNavigation />
        <Footer />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">Material Not Found</h2>
            <p className="mt-2 text-muted-foreground">The material you're looking for doesn't exist or has been removed.</p>
            <Button className="mt-6" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </main>
        <MobileNavigation />
        <Footer />
      </div>
    );
  }

  // Get waste type display information
  const typeInfo = getWasteTypeDisplay(material.materialType);
  
  // Check if this is the collector's own material
  const isOwner = user?.id === material.collectorId;
  
  // Calculate estimated environmental impact
  const estimatedCO2Offset = material.quantity * 2; // 2kg CO2 per kg of material
  const estimatedWaterSaved = material.quantity * 50; // 50L of water saved per kg
  const estimatedEnergyConserved = material.quantity * 5; // 5kWh energy conserved per kg

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button and Status Badge */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Badge
              className={
                material.status === 'available' ? 'bg-green-100 text-green-800 border-green-200' : 
                material.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                'bg-blue-100 text-blue-800 border-blue-200'
              }
            >
              {material.status.charAt(0).toUpperCase() + material.status.slice(1)}
            </Badge>
          </div>
          
          {/* Material Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <div 
                className="w-8 h-8 rounded-full mr-3 flex items-center justify-center"
                style={{ backgroundColor: `${typeInfo.color}25`, color: typeInfo.color }}
              >
                <Recycle className="h-5 w-5" />
              </div>
              {typeInfo.name} Material - {formatNumber(material.quantity)}kg
            </h1>
            <p className="text-muted-foreground flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Listed on {new Date(material.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Material Details */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Material Details</CardTitle>
                  <CardDescription>
                    Information about this recycling material
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Pickup Location</h3>
                      <p>{material.location}</p>
                    </div>
                  </div>
                  
                  {material.description && (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Description</h3>
                        <p>{material.description}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Collector</h3>
                      <p>ID: {material.collectorId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <PackageCheck className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Quantity</h3>
                      <p>{formatNumber(material.quantity)} kilograms</p>
                    </div>
                  </div>
                  
                  {material.price ? (
                    <div className="flex items-start gap-3">
                      <CircleDollarSign className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Listed Price</h3>
                        <p>KES {formatNumber(material.price, 2)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <Banknote className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Pricing</h3>
                        <p>Open for bidding</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                {user?.role === UserRole.RECYCLER && !isOwner && (
                  <CardFooter>
                    <Button 
                      onClick={handleBid}
                      disabled={placeBidMutation.isPending || hasPlacedBid}
                      className="w-full"
                    >
                      {hasPlacedBid ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Bid Placed
                        </>
                      ) : placeBidMutation.isPending ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Banknote className="mr-2 h-4 w-4" />
                          Place Bid
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </Card>
              
              {/* Bids Section */}
              {(isOwner || user?.role === UserRole.RECYCLER) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Bids</CardTitle>
                    <CardDescription>
                      {isOwner 
                        ? "Review bids from recyclers" 
                        : "Bids placed on this material"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bids.length === 0 ? (
                      <div className="text-center py-6">
                        <History className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">No bids have been placed yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {bids.map(bid => (
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
                                <div className="flex items-start gap-2">
                                  <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                  <p className="text-sm">{bid.message}</p>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Environmental Impact and Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Environmental Impact</CardTitle>
                  <CardDescription>
                    Potential environmental benefits of recycling this material
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-green-100 mr-3">
                        <Leaf className="h-5 w-5 text-green-600" />
                      </div>
                      <span>CO₂ Offset</span>
                    </div>
                    <span className="font-medium">{formatNumber(estimatedCO2Offset)} kg</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-blue-100 mr-3">
                        <Recycle className="h-5 w-5 text-blue-600" />
                      </div>
                      <span>Water Saved</span>
                    </div>
                    <span className="font-medium">{formatNumber(estimatedWaterSaved)} L</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-amber-100 mr-3">
                        <Truck className="h-5 w-5 text-amber-600" />
                      </div>
                      <span>Energy Conserved</span>
                    </div>
                    <span className="font-medium">{formatNumber(estimatedEnergyConserved)} kWh</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Owner Actions */}
              {isOwner && (
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center"
                      onClick={() => navigate('/materials/manage')}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Listing
                    </Button>
                    
                    <Button 
                      className="w-full flex items-center justify-center"
                      onClick={() => navigate('/materials/manage')}
                    >
                      <History className="mr-2 h-4 w-4" />
                      View All Bids
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
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
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}