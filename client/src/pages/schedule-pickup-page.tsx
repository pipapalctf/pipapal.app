import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";
import SchedulePickupForm from "@/components/forms/schedule-pickup-form";
import { useQuery } from "@tanstack/react-query";
import { Collection, CollectionStatus } from "@shared/schema";
import { 
  CalendarCheck, 
  CalendarPlus, 
  Calendar, 
  PlusCircle, 
  Clock, 
  MapPin, 
  Recycle, 
  CircleCheck, 
  Trash2, 
  Truck, 
  Loader2, 
  Clock3,
  Edit,
  X,
  BadgeCheck
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function SchedulePickupPage() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("schedule");
  
  // Handle tab selection based on URL parameter
  useEffect(() => {
    // Check if there's a tab parameter
    if (location.includes("?tab=pickups")) {
      setActiveTab("pickups");
    } else {
      setActiveTab("schedule");
    }
  }, [location]);
  
  // Fetch collections
  const { data: collections = [], isLoading } = useQuery<Collection[]>({
    queryKey: ['/api/collections'],
  });
  
  // Fetch upcoming collections
  const { data: upcomingCollections = [] } = useQuery<Collection[]>({
    queryKey: ['/api/collections/upcoming'],
  });
  
  // Cancel collection mutation
  const cancelCollectionMutation = useMutation({
    mutationFn: async (collectionId: number) => {
      const res = await apiRequest("PATCH", `/api/collections/${collectionId}`, {
        status: CollectionStatus.CANCELLED
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Collection cancelled",
        description: "The waste collection has been cancelled successfully"
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/collections/upcoming'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel collection",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Function to handle cancellation
  const handleCancelRequest = (collection: Collection) => {
    if (window.confirm("Are you sure you want to cancel this collection?")) {
      cancelCollectionMutation.mutate(collection.id);
    }
  };
  
  // Function to handle edit/reschedule
  const handleEditRequest = (collection: Collection) => {
    navigate(`/schedule-pickup?edit=${collection.id}`);
  };
  
  // Get status badge configuration
  const getStatusBadge = (status: string) => {
    switch (status) {
      case CollectionStatus.PENDING:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">Pending</Badge>;
      case CollectionStatus.CONFIRMED:
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Confirmed</Badge>;
      case CollectionStatus.IN_PROGRESS:
        return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">In Progress</Badge>;
      case CollectionStatus.COMPLETED:
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Completed</Badge>;
      case CollectionStatus.CANCELLED:
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8 md:py-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-montserrat font-bold text-secondary">
              Waste Collection Management
            </h1>
            <p className="text-gray-600 mt-1">
              Schedule new collections or manage your existing pickups
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="schedule" className="flex items-center">
                <CalendarPlus className="mr-2 h-4 w-4" />
                Schedule New Pickup
              </TabsTrigger>
              <TabsTrigger value="pickups" className="flex items-center">
                <Truck className="mr-2 h-4 w-4" />
                My Scheduled Pickups
              </TabsTrigger>
            </TabsList>
            
            {/* Schedule New Pickup Tab */}
            <TabsContent value="schedule">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Collection Details</CardTitle>
                      <CardDescription>
                        Provide the necessary information for your waste collection
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SchedulePickupForm />
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-6">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-primary">
                        <CalendarCheck className="mr-2 h-5 w-5" />
                        Tips for Collection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-start">
                          <CircleCheck className="h-4 w-4 text-primary mt-1 mr-2" />
                          <span>Schedule at least 24 hours in advance for better service</span>
                        </li>
                        <li className="flex items-start">
                          <CircleCheck className="h-4 w-4 text-primary mt-1 mr-2" />
                          <span>Sort your waste by type for efficient recycling</span>
                        </li>
                        <li className="flex items-start">
                          <CircleCheck className="h-4 w-4 text-primary mt-1 mr-2" />
                          <span>Ensure waste is properly bagged and accessible</span>
                        </li>
                        <li className="flex items-start">
                          <CircleCheck className="h-4 w-4 text-primary mt-1 mr-2" />
                          <span>Add specific notes if your location is hard to find</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-green-600">
                        <Recycle className="mr-2 h-5 w-5" />
                        Points System
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-3">
                        Earn sustainability points based on waste type:
                      </p>
                      <div className="space-y-2 text-sm mb-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                            <span>Hazardous: 20 pts</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                            <span>Electronic: 15 pts</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
                            <span>Metal: 12 pts</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                            <span>Glass/Plastic: 10 pts</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                            <span>Paper/Organic: 8 pts</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                            <span>General: 5 pts</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Points shown are for standard 10kg waste collection. Points accumulate to unlock badges and rewards!
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* My Scheduled Pickups Tab */}
            <TabsContent value="pickups">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="mr-2 h-5 w-5" />
                    My Scheduled Pickups
                  </CardTitle>
                  <CardDescription>
                    View and manage your upcoming and past waste collections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : upcomingCollections.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium mb-2">Upcoming Pickups</h3>
                      {upcomingCollections.map((collection) => {
                        const scheduledDate = new Date(collection.scheduledDate);
                        return (
                          <div key={collection.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                            <div className="flex items-start space-x-4">
                              <div className={`p-3 rounded-full ${
                                collection.status === CollectionStatus.PENDING 
                                  ? "bg-yellow-100" 
                                  : collection.status === CollectionStatus.CONFIRMED 
                                  ? "bg-blue-100" 
                                  : "bg-primary/10"
                              }`}>
                                <Truck className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium capitalize">{collection.wasteType} Waste Pickup</h4>
                                  {getStatusBadge(collection.status)}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    <span>{format(scheduledDate, 'PPP')}</span>
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>{format(scheduledDate, 'p')}</span>
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    <span>{collection.address}</span>
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <Recycle className="h-4 w-4 mr-1" />
                                    <span>{collection.wasteAmount || 10}kg</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-blue-600"
                                    onClick={() => handleEditRequest(collection)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Reschedule
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={() => handleCancelRequest(collection)}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })}
                      
                      <h3 className="text-lg font-medium mt-6 mb-2">Past Pickups</h3>
                      {collections.filter(c => 
                        c.status === CollectionStatus.COMPLETED || 
                        c.status === CollectionStatus.CANCELLED
                      ).length > 0 ? (
                        collections.filter(c => 
                          c.status === CollectionStatus.COMPLETED || 
                          c.status === CollectionStatus.CANCELLED
                        ).map((collection) => {
                          const scheduledDate = new Date(collection.scheduledDate);
                          return (
                            <div key={collection.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                              <div className="flex items-start space-x-4">
                                <div className={`p-3 rounded-full ${
                                  collection.status === CollectionStatus.COMPLETED 
                                    ? "bg-green-100" 
                                    : "bg-red-100"
                                }`}>
                                  {collection.status === CollectionStatus.COMPLETED ? (
                                    <BadgeCheck className="h-6 w-6 text-green-600" />
                                  ) : (
                                    <X className="h-6 w-6 text-red-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-medium capitalize">{collection.wasteType} Waste Pickup</h4>
                                    {getStatusBadge(collection.status)}
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      <span>{format(scheduledDate, 'PPP')}</span>
                                    </div>
                                    <div className="flex items-center mt-1">
                                      <Recycle className="h-4 w-4 mr-1" />
                                      <span>{collection.wasteAmount || 10}kg</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center p-6 text-muted-foreground bg-muted/20 rounded-lg">
                          <p>No past collections found</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10 px-6">
                      <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-6 mb-4">
                        <CalendarPlus className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No collections scheduled yet</h3>
                      <p className="text-muted-foreground mb-6">
                        You haven't scheduled any waste collections. Start reducing your environmental footprint today!
                      </p>
                      <Button onClick={() => setActiveTab("schedule")}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Schedule Your First Pickup
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}
