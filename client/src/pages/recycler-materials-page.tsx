import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Recycle, Leaf, Package, Filter, MapPin, ArrowRight, Calendar, CircleDollarSign, 
  Truck, AlertCircle, CheckCircle2, Scale, Clock, Cpu, Apple, FlaskConical,
  Search, ChevronLeft, ChevronRight, ArrowUpDown
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { 
  Collection,
  CollectionStatus,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

export default function RecyclerMaterialsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [filterWasteType, setFilterWasteType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('available');

  // Fetch collections that are pending/ready for recyclers to process
  const { data: collections = [], isLoading, isError, error } = useQuery<Collection[]>({
    queryKey: ['/api/collections'],
    staleTime: 60000, // Add staleTime to keep data for longer (1 minute)
    refetchOnWindowFocus: false, // Prevent refetching when window gains focus
  });
  
  // Debug collections data
  useEffect(() => {
    console.log('Collections data:', collections);
    if (collections.length > 0) {
      console.log('First collection:', collections[0]);
    }
  }, [collections]);

  // Include collections that are in either COMPLETED or IN_PROGRESS status
  // These are collections that are either being processed or ready for recyclers
  const availableCollections = collections.filter(
    (collection: Collection) => 
      // Include completed collections with a waste amount
      (collection.status === CollectionStatus.COMPLETED && collection.wasteAmount) ||
      // Or collections that are in progress and have a collector assigned
      (collection.status === CollectionStatus.IN_PROGRESS && collection.collectorId)
  );

  // Apply waste type filter
  const filteredByWasteType = filterWasteType === 'all' 
    ? availableCollections 
    : availableCollections.filter((collection: Collection) => collection.wasteType === filterWasteType);

  // Group materials by waste type for easier viewing
  const groupedMaterials = filteredByWasteType.reduce((groups: Record<string, Collection[]>, collection: Collection) => {
    const wasteType = collection.wasteType || 'general';
    if (!groups[wasteType]) {
      groups[wasteType] = [];
    }
    groups[wasteType].push(collection);
    return groups;
  }, {} as Record<string, Collection[]>);

  // Calculate total materials available
  const totalMaterials = availableCollections.reduce(
    (total: number, collection: Collection) => total + (collection.wasteAmount || 0),
    0
  );

  // Calculate materials by type for the summary cards
  const materialsByType = availableCollections.reduce((acc: Record<string, number>, collection: Collection) => {
    const wasteType = collection.wasteType || 'general';
    if (!acc[wasteType]) {
      acc[wasteType] = 0;
    }
    acc[wasteType] += (collection.wasteAmount || 0);
    return acc;
  }, {});

  // Express interest in materials mutation
  const expressInterestMutation = useMutation({
    mutationFn: async (collectionId: number) => {
      const response = await apiRequest('POST', '/api/materials/express-interest', { collectionId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Interest Recorded",
        description: "Your interest in this material has been recorded. The system will notify relevant parties.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Express Interest",
        description: error.message || "There was an error recording your interest. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle purchasing/acquiring materials
  const handleAcquireMaterial = (collectionId: number) => {
    expressInterestMutation.mutate(collectionId);
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

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Combine all collections into a single array for the table view
  const allMaterials = [...filteredByWasteType];
  
  // Apply search filter
  const filteredMaterials = allMaterials.filter(collection => {
    const searchString = searchQuery.toLowerCase();
    const wasteType = collection.wasteType || '';
    const address = collection.address || '';
    const notes = collection.notes || '';
    
    return (
      wasteType.toLowerCase().includes(searchString) ||
      address.toLowerCase().includes(searchString) ||
      notes.toLowerCase().includes(searchString)
    );
  });
  
  // Paginate the data
  const paginatedMaterials = filteredMaterials.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // Calculate page count
  const pageCount = Math.ceil(filteredMaterials.length / rowsPerPage);
  
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

          {/* Filter and Search Controls */}
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
            <div className="flex-1 md:flex-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by location, material type, or notes..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block p-4 rounded-full bg-muted">
                <Clock className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="mt-4 text-lg font-medium">Loading available materials...</p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <Card className="text-center p-12">
              <CardContent>
                <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium mb-2">No Materials Available</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  There are currently no completed or in-progress collections with materials available for recycling.
                  Check back later or adjust your filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => {}}>
                        Material Type <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => {}}>
                        Amount <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => {}}>
                        Location <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Collection Date</TableHead>
                    <TableHead>Est. Value</TableHead>
                    <TableHead>CO₂ Offset</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMaterials.map((collection) => {
                    const typeInfo = getWasteTypeDisplay(collection.wasteType || 'general');
                    return (
                      <TableRow key={collection.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-full" style={{ backgroundColor: `${typeInfo.color}20`, color: typeInfo.color }}>
                              {typeInfo.icon}
                            </div>
                            <span>{typeInfo.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{formatNumber(collection.wasteAmount || 0)} kg</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start gap-1">
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate max-w-[200px]">{collection.address}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            collection.status === CollectionStatus.COMPLETED 
                              ? "bg-green-50 text-green-700 border-green-200 text-xs" 
                              : "bg-blue-50 text-blue-700 border-blue-200 text-xs"
                          }>
                            {collection.status === CollectionStatus.COMPLETED ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" />Completed</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1" />In Progress</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(collection.completedDate || collection.scheduledDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <CircleDollarSign className="h-3.5 w-3.5 mr-1 text-amber-600" />
                            <span>${formatNumber((collection.wasteAmount || 0) * 0.2, 2)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Leaf className="h-3.5 w-3.5 mr-1 text-green-600" />
                            <span>{formatNumber((collection.wasteAmount || 0) * 2)} kg</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Disable Details button until collection details page is implemented */}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                toast({
                                  title: "Coming Soon",
                                  description: "Collection details page is under development",
                                  variant: "default",
                                });
                              }}
                            >
                              Details
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAcquireMaterial(collection.id)}
                              disabled={expressInterestMutation.isPending}
                            >
                              {expressInterestMutation.isPending ? (
                                <>
                                  <Clock className="h-3.5 w-3.5 mr-1 animate-spin" />
                                  Processing
                                </>
                              ) : (
                                "Express Interest"
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="flex-1 text-sm text-muted-foreground">
                  Showing <span className="font-medium">{Math.min(filteredMaterials.length, page * rowsPerPage + 1)}</span> to{" "}
                  <span className="font-medium">{Math.min(filteredMaterials.length, (page + 1) * rowsPerPage)}</span> of{" "}
                  <span className="font-medium">{filteredMaterials.length}</span> materials
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={page >= pageCount - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
}