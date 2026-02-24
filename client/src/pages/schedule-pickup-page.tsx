import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import MobileNavigation from "@/components/shared/mobile-navigation";
import SchedulePickupForm from "@/components/forms/schedule-pickup-form";
import MultiStepPickupForm from "@/components/forms/multi-step-pickup-form-fixed";
import { useQuery } from "@tanstack/react-query";
import { Collection, CollectionStatus } from "@shared/schema";
import { CollectionDetailsDialog } from "@/components/modals/collection-details-dialog";
import PaymentDialog from "@/components/payment-dialog";
import { Payment } from "@shared/schema";
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
  Scale,
  Filter,
  SortDesc,
  SortAsc,
  ArrowUpDown,
  FileText,
  AlertCircle,
  Smartphone,
  CheckCircle
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
import { scrollToSection, scrollToElement, createScrollHandler, handleTabChange } from "@/lib/scroll-utils";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";

// Sorting options
type SortField = 'date' | 'wasteType' | 'address' | 'status';
type SortOrder = 'asc' | 'desc';

export default function SchedulePickupPage() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("schedule");
  const [currentPage, setCurrentPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const itemsPerPage = 4; // Reduced to show fewer items per page for better visibility
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Handle tab selection based on URL parameter
  useEffect(() => {
    // Get the tab parameter from the URL
    const params = new URLSearchParams(location.split('?')[1]);
    const tabParam = params.get('tab');
    
    // Set the active tab based on the parameter
    if (tabParam === 'pickups') {
      setActiveTab("pickups");
    } else if (tabParam === 'schedule') {
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

  const { data: userPayments = [] } = useQuery<Payment[]>({
    queryKey: ['/api/payments/user'],
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
  
  // Toggle sort order or change field
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  // Function to get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    }
    return sortOrder === 'asc' 
      ? <SortAsc className="h-4 w-4 ml-1 text-primary" /> 
      : <SortDesc className="h-4 w-4 ml-1 text-primary" />;
  };
  
  // Sort collections based on selected field and order
  const sortedUpcomingCollections = [...upcomingCollections].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'date':
        comparison = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
        break;
      case 'wasteType':
        comparison = (a.wasteType || '').localeCompare(b.wasteType || '');
        break;
      case 'address':
        comparison = (a.address || '').localeCompare(b.address || '');
        break;
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '');
        break;
      default:
        comparison = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  // Get upcoming collections for the selected page
  const paginatedUpcomingCollections = sortedUpcomingCollections
    .slice((upcomingPage - 1) * itemsPerPage, upcomingPage * itemsPerPage);
  
  const totalUpcomingPages = Math.ceil(sortedUpcomingCollections.length / itemsPerPage);
  
  // Get past collections for the selected page
  const filteredPastCollections = collections
    .filter(c => c.status === CollectionStatus.COMPLETED || c.status === CollectionStatus.CANCELLED);
    
  // Sort past collections (using the same sorting logic)
  const sortedPastCollections = [...filteredPastCollections].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'date':
        comparison = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
        break;
      case 'wasteType':
        comparison = (a.wasteType || '').localeCompare(b.wasteType || '');
        break;
      case 'address':
        comparison = (a.address || '').localeCompare(b.address || '');
        break;
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '');
        break;
      default:
        comparison = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  const paginatedPastCollections = sortedPastCollections
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const totalPastPages = Math.ceil(sortedPastCollections.length / itemsPerPage);
  
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
              // Use setTimeout to ensure the tab content is rendered before scrolling
              setTimeout(() => {
                scrollToElement(`${value}-tab-content`, 80);
              }, 10);
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
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                  <Card>
                    <CardContent className="p-6" id="pickup-form-container">
                      <MultiStepPickupForm 
                        collectionToEdit={collectionToEdit} 
                        onSuccess={() => {
                          setCollectionToEdit(null);
                          navigate('/schedule-pickup?tab=pickups');
                          scrollToElement('pickups-tab-content', 80);
                        }} 
                      />
                    </CardContent>
                  </Card>
                </div>
                
                {/* Collection Tips Side Panel */}
                <div className="xl:col-span-1">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <BadgeCheck className="h-5 w-5 mr-2 text-primary" />
                        Collection Tips
                      </CardTitle>
                      <CardDescription>
                        Best practices for scheduling waste pickups
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Tip 1 */}
                      <div className="p-3 bg-primary/5 rounded-md border border-primary/15">
                        <div className="flex gap-2 items-start">
                          <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-sm">Schedule in Advance</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Schedule collections at least 24 hours in advance to give collectors enough time to plan their routes.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tip 2 */}
                      <div className="p-3 bg-primary/5 rounded-md border border-primary/15">
                        <div className="flex gap-2 items-start">
                          <MapPin className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-sm">Precise Location Details</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Include landmarks or building details in your address to help collectors find your location easily.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tip 3 */}
                      <div className="p-3 bg-primary/5 rounded-md border border-primary/15">
                        <div className="flex gap-2 items-start">
                          <Scale className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-sm">Accurate Weight Estimation</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Estimate waste weight as accurately as possible—this helps collectors prepare appropriate transport.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tip 4 */}
                      <div className="p-3 bg-primary/5 rounded-md border border-primary/15">
                        <div className="flex gap-2 items-start">
                          <FileText className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-sm">Special Instructions</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Add any special instructions like gate codes, preferred collection areas, or access restrictions.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tip 5 */}
                      <div className="p-3 bg-amber-100 rounded-md border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40">
                        <div className="flex gap-2 items-start">
                          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-sm">Cancellation Policy</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              If you need to cancel, please do so at least 6 hours before the scheduled pickup time.
                            </p>
                          </div>
                        </div>
                      </div>
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
                              <TableHead>
                                <button 
                                  onClick={() => handleSort('wasteType')} 
                                  className="flex items-center hover:text-primary"
                                >
                                  Type
                                  {getSortIcon('wasteType')}
                                </button>
                              </TableHead>
                              <TableHead>
                                <button 
                                  onClick={() => handleSort('date')} 
                                  className="flex items-center hover:text-primary"
                                >
                                  Date
                                  {getSortIcon('date')}
                                </button>
                              </TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>
                                <button 
                                  onClick={() => handleSort('address')} 
                                  className="flex items-center hover:text-primary"
                                >
                                  Location
                                  {getSortIcon('address')}
                                </button>
                              </TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>
                                <button 
                                  onClick={() => handleSort('status')} 
                                  className="flex items-center hover:text-primary"
                                >
                                  Status
                                  {getSortIcon('status')}
                                </button>
                              </TableHead>
                              <TableHead>Payment</TableHead>
                              <TableHead className="w-[80px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedUpcomingCollections.map((collection) => {
                              const scheduledDate = new Date(collection.scheduledDate);
                              const collectionPayments = userPayments.filter(p => p.collectionId === collection.id);
                              const hasPaid = collectionPayments.some(p => p.status === 'success');
                              const paidPayment = collectionPayments.find(p => p.status === 'success');
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
                                    {hasPaid ? (
                                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Paid{paidPayment ? ` KES ${paidPayment.amount}` : ''}
                                      </Badge>
                                    ) : collection.status !== 'cancelled' ? (
                                      <PaymentDialog
                                        collectionId={collection.id}
                                        suggestedAmount={collection.wasteAmount ? Math.round(collection.wasteAmount * 50) : 500}
                                        trigger={
                                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                            <Smartphone className="h-3 w-3 mr-1" />
                                            Pay Now
                                          </Button>
                                        }
                                      />
                                    ) : (
                                      <span className="text-muted-foreground text-sm">—</span>
                                    )}
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
                      
                      {sortedPastCollections.length > 0 ? (
                        <div className="space-y-4">
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>
                                    <button 
                                      onClick={() => handleSort('wasteType')} 
                                      className="flex items-center hover:text-primary"
                                    >
                                      Type
                                      {getSortIcon('wasteType')}
                                    </button>
                                  </TableHead>
                                  <TableHead>
                                    <button 
                                      onClick={() => handleSort('date')} 
                                      className="flex items-center hover:text-primary"
                                    >
                                      Date
                                      {getSortIcon('date')}
                                    </button>
                                  </TableHead>
                                  <TableHead>Time</TableHead>
                                  <TableHead>
                                    <button 
                                      onClick={() => handleSort('address')} 
                                      className="flex items-center hover:text-primary"
                                    >
                                      Location
                                      {getSortIcon('address')}
                                    </button>
                                  </TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>
                                    <button 
                                      onClick={() => handleSort('status')} 
                                      className="flex items-center hover:text-primary"
                                    >
                                      Status
                                      {getSortIcon('status')}
                                    </button>
                                  </TableHead>
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
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                          
                          {/* Pagination for past pickups */}
                          {sortedPastCollections.length > itemsPerPage && (
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

      {/* Collection Details Dialog */}
      <CollectionDetailsDialog 
        collectionId={selectedCollectionId}
        open={collectionDetailsOpen}
        onOpenChange={setCollectionDetailsOpen}
      />
    </div>
  );
}