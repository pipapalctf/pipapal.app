import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";
import SchedulePickupForm from "@/components/forms/schedule-pickup-form";
import { useQuery } from "@tanstack/react-query";
import { Collection, CollectionStatus } from "@shared/schema";
import { CollectionDetailsDialog } from "@/components/modals/collection-details-dialog";
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
  BadgeCheck,
  MoreHorizontal,
  Scale
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { scrollToTop, scrollToElement } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function SchedulePickupPage() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("schedule");
  const [currentPage, setCurrentPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const itemsPerPage = 4; // Reduced to show fewer items per page for better visibility
  
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
  
  // State for the collection to be cancelled
  const [collectionToCancel, setCollectionToCancel] = useState<Collection | null>(null);
  
  // State for the collection being edited
  const [collectionToEdit, setCollectionToEdit] = useState<Collection | null>(null);
  
  // State for collection details dialog
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [collectionDetailsOpen, setCollectionDetailsOpen] = useState(false);
  
  // Parse collection ID from URL or hash if present
  useEffect(() => {
    // Check for edit in query params or hash
    const queryMatch = location.match(/edit=(\d+)/);
    const hashMatch = window.location.hash.match(/edit=(\d+)/);
    
    // Use either match, prioritizing query params
    const match = queryMatch || hashMatch;
    
    if (match && match[1]) {
      const collectionId = parseInt(match[1], 10);
      const collection = upcomingCollections.find(c => c.id === collectionId);
      if (collection) {
        setCollectionToEdit(collection);
        setActiveTab("schedule");
      }
    }
  }, [location, upcomingCollections]);
  
  // Function to handle cancellation
  const handleCancelRequest = (collection: Collection) => {
    setCollectionToCancel(collection);
  };
  
  // Function to confirm cancellation
  const confirmCancellation = () => {
    if (collectionToCancel) {
      cancelCollectionMutation.mutate(collectionToCancel.id);
      setCollectionToCancel(null);
    }
  };
  
  // Function to handle edit/reschedule
  const handleEditRequest = (collection: Collection) => {
    setCollectionToEdit(collection);
    setActiveTab("schedule");
    scrollToElement('schedule-tab-content', 80);
    // No URL update needed, just manage with state
  };
  
  // Function to handle view details
  const handleViewDetails = (collection: Collection) => {
    setSelectedCollectionId(collection.id);
    setCollectionDetailsOpen(true);
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
  
  // Get upcoming collections for the selected page
  const paginatedUpcomingCollections = upcomingCollections
    .slice((upcomingPage - 1) * itemsPerPage, upcomingPage * itemsPerPage);
  
  const totalUpcomingPages = Math.ceil(upcomingCollections.length / itemsPerPage);
  
  // Get past collections for the selected page
  const pastCollections = collections
    .filter(c => c.status === CollectionStatus.COMPLETED || c.status === CollectionStatus.CANCELLED)
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
  
  const paginatedPastCollections = pastCollections
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const totalPastPages = Math.ceil(pastCollections.length / itemsPerPage);
  
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
          
          <Tabs value={activeTab} onValueChange={(value) => {
              setActiveTab(value);
              // Scroll to the specific tab content instead of the top
              scrollToElement(`${value}-tab-content`, 80);
            }} className="mb-6">
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
            <TabsContent value="schedule" id="schedule-tab-content">
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
                      <SchedulePickupForm collectionToEdit={collectionToEdit} onSuccess={() => {
                        setCollectionToEdit(null);
                        navigate('/schedule-pickup?tab=pickups');
                        scrollToElement('pickups-tab-content', 80);
                      }} />
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
            <TabsContent value="pickups" id="pickups-tab-content">
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
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">Upcoming Pickups</h3>
                      
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="w-[80px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedUpcomingCollections.map((collection) => {
                              const scheduledDate = new Date(collection.scheduledDate);
                              return (
                                <TableRow key={collection.id}>
                                  <TableCell className="font-medium capitalize">
                                    <div className="flex items-center gap-2">
                                      <div className={`p-2 rounded-full ${
                                        collection.status === CollectionStatus.PENDING 
                                          ? "bg-yellow-100" 
                                          : collection.status === CollectionStatus.CONFIRMED 
                                          ? "bg-blue-100" 
                                          : "bg-primary/10"
                                      }`}>
                                        <Truck className="h-4 w-4 text-primary" />
                                      </div>
                                      <span>{collection.wasteType}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                      <span>{format(scheduledDate, 'MMM dd, yyyy')}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                                      <span>{format(scheduledDate, 'h:mm a')}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                                      <span className="truncate max-w-[120px]" title={collection.address}>
                                        {collection.address}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Scale className="h-4 w-4 mr-1 text-muted-foreground" />
                                      <span>{collection.wasteAmount || 10}kg</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {getStatusBadge(collection.status)}
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => handleViewDetails(collection)}
                                        >
                                          <Calendar className="mr-2 h-4 w-4" />
                                          View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
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
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {/* Pagination for upcoming pickups */}
                      {upcomingCollections.length > itemsPerPage && (
                        <Pagination className="mt-4">
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => setUpcomingPage(p => Math.max(1, p - 1))} 
                                className={upcomingPage === 1 ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                            
                            {Array.from({ length: Math.min(5, totalUpcomingPages) }, (_, i) => {
                              const pageNumber = i + 1;
                              return (
                                <PaginationItem key={pageNumber}>
                                  <PaginationLink 
                                    onClick={() => setUpcomingPage(pageNumber)}
                                    isActive={upcomingPage === pageNumber}
                                  >
                                    {pageNumber}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            })}
                            
                            {totalUpcomingPages > 5 && (
                              <>
                                <PaginationItem>
                                  <PaginationEllipsis />
                                </PaginationItem>
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() => setUpcomingPage(totalUpcomingPages)}
                                    isActive={upcomingPage === totalUpcomingPages}
                                  >
                                    {totalUpcomingPages}
                                  </PaginationLink>
                                </PaginationItem>
                              </>
                            )}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => setUpcomingPage(p => Math.min(totalUpcomingPages, p + 1))} 
                                className={upcomingPage === totalUpcomingPages ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                      
                      <h3 className="text-lg font-medium mt-8">Past Pickups</h3>
                      
                      {pastCollections.length > 0 ? (
                        <div className="space-y-4">
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Time</TableHead>
                                  <TableHead>Location</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="w-[80px]">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {paginatedPastCollections.map((collection) => {
                                  const scheduledDate = new Date(collection.scheduledDate);
                                  return (
                                    <TableRow key={collection.id}>
                                      <TableCell className="font-medium capitalize">
                                        <div className="flex items-center gap-2">
                                          <div className={`p-2 rounded-full ${
                                            collection.status === CollectionStatus.COMPLETED 
                                              ? "bg-green-100" 
                                              : "bg-red-100"
                                          }`}>
                                            {collection.status === CollectionStatus.COMPLETED ? (
                                              <BadgeCheck className="h-4 w-4 text-green-600" />
                                            ) : (
                                              <X className="h-4 w-4 text-red-600" />
                                            )}
                                          </div>
                                          <span>{collection.wasteType}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center">
                                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                          <span>{format(scheduledDate, 'MMM dd, yyyy')}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center">
                                          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                                          <span>{format(scheduledDate, 'h:mm a')}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center">
                                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                                          <span className="truncate max-w-[120px]" title={collection.address}>
                                            {collection.address}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center">
                                          <Scale className="h-4 w-4 mr-1 text-muted-foreground" />
                                          <span>{collection.wasteAmount || 10}kg</span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {getStatusBadge(collection.status)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                          
                          {/* Pagination for past pickups */}
                          {pastCollections.length > itemsPerPage && (
                            <Pagination className="mt-4">
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                  />
                                </PaginationItem>
                                
                                {Array.from({ length: Math.min(5, totalPastPages) }, (_, i) => {
                                  const pageNumber = i + 1;
                                  return (
                                    <PaginationItem key={pageNumber}>
                                      <PaginationLink 
                                        onClick={() => setCurrentPage(pageNumber)}
                                        isActive={currentPage === pageNumber}
                                      >
                                        {pageNumber}
                                      </PaginationLink>
                                    </PaginationItem>
                                  );
                                })}
                                
                                {totalPastPages > 5 && (
                                  <>
                                    <PaginationItem>
                                      <PaginationEllipsis />
                                    </PaginationItem>
                                    <PaginationItem>
                                      <PaginationLink
                                        onClick={() => setCurrentPage(totalPastPages)}
                                        isActive={currentPage === totalPastPages}
                                      >
                                        {totalPastPages}
                                      </PaginationLink>
                                    </PaginationItem>
                                  </>
                                )}
                                
                                <PaginationItem>
                                  <PaginationNext 
                                    onClick={() => setCurrentPage(p => Math.min(totalPastPages, p + 1))} 
                                    className={currentPage === totalPastPages ? "pointer-events-none opacity-50" : ""} 
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500 rounded-md border p-4">
                          <p>No past pickups found.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="mx-auto bg-muted inline-flex h-20 w-20 items-center justify-center rounded-full mb-4">
                        <CalendarPlus className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">No pickups scheduled</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        You don't have any waste collection scheduled. Use the Schedule New Pickup tab to arrange a collection.
                      </p>
                      <Button onClick={() => setActiveTab("schedule")}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Schedule a Pickup
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
      
      {/* Cancel Collection Confirmation Dialog */}
      <AlertDialog open={collectionToCancel !== null} onOpenChange={(open) => !open && setCollectionToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this waste collection?
              {collectionToCancel && (
                <div className="mt-4 p-3 border rounded-md bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-primary" />
                    <span className="font-medium capitalize">{collectionToCancel.wasteType} Waste Pickup</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(collectionToCancel.scheduledDate), 'PPP')}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(collectionToCancel.scheduledDate), 'p')}</span>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancellation}
              className="bg-red-500 hover:bg-red-600"
            >
              Yes, Cancel Collection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}