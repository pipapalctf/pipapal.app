import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Recycle, Leaf, Package, Filter, MapPin, ArrowRight, Calendar, CircleDollarSign, Truck, AlertCircle, CheckCircle2, Scale, Clock } from 'lucide-react';
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

export default function RecyclerMaterialsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [filterWasteType, setFilterWasteType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('available');

  // Fetch collections that are pending/ready for recyclers to process
  const { data: collections = [], isLoading } = useQuery<Collection[]>({
    queryKey: ['/api/collections'],
  });

  // Only include collections that are in COMPLETED status with a wasteAmount
  // These are collections that have been processed by collectors and are ready for recyclers
  const completedCollections = collections.filter(
    (collection: Collection) => collection.status === CollectionStatus.COMPLETED && collection.wasteAmount
  );

  // Apply waste type filter
  const filteredByWasteType = filterWasteType === 'all' 
    ? completedCollections 
    : completedCollections.filter((collection: Collection) => collection.wasteType === filterWasteType);

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
  const totalMaterials = completedCollections.reduce(
    (total: number, collection: Collection) => total + (collection.wasteAmount || 0),
    0
  );

  // Calculate materials by type for the summary cards
  const materialsByType = completedCollections.reduce((acc: Record<string, number>, collection: Collection) => {
    const wasteType = collection.wasteType || 'general';
    if (!acc[wasteType]) {
      acc[wasteType] = 0;
    }
    acc[wasteType] += (collection.wasteAmount || 0);
    return acc;
  }, {});

  // Handle purchasing/acquiring materials
  const handleAcquireMaterial = (collectionId: number) => {
    toast({
      title: "Interest Recorded",
      description: "Your interest in this material has been recorded. The system will notify the collector.",
      variant: "default",
    });
  };

  // Get waste type display name and color
  const getWasteTypeDisplay = (type: string) => {
    const config = wasteTypeConfig[type as keyof typeof wasteTypeConfig] || wasteTypeConfig.general;
    
    // Map icon strings to Lucide React components
    const getIconComponent = (iconName: string) => {
      switch(iconName) {
        case 'trash': return <Package className="h-4 w-4" />;
        case 'recycle': return <Recycle className="h-4 w-4" />;
        case 'file': return <Package className="h-4 w-4" />;
        case 'wine-glass': return <Package className="h-4 w-4" />;
        case 'shopping-bag': return <Package className="h-4 w-4" />;
        case 'cpu': return <Package className="h-4 w-4" />;
        case 'apple': return <Package className="h-4 w-4" />;
        case 'flask': return <Package className="h-4 w-4" />;
        case 'package': return <Package className="h-4 w-4" />;
        default: return <Package className="h-4 w-4" />;
      }
    };
    
    return {
      name: config.label || type.charAt(0).toUpperCase() + type.slice(1),
      color: config.textColor.replace('text-', ''),
      icon: getIconComponent(config.icon)
    };
  };

  // Calculate estimated CO2 offset
  const estimatedCO2Offset = totalMaterials * 2; // 2kg CO2 per kg of recycled material

  return (
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
          {Object.entries(groupedMaterials).map(([wasteType, collections]) => {
            const typeInfo = getWasteTypeDisplay(wasteType);
            
            return (
              <div key={wasteType} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full" style={{ backgroundColor: `${typeInfo.color}25` }}>
                    <div className="p-1 rounded-full" style={{ color: typeInfo.color }}>
                      {typeInfo.icon}
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold">{typeInfo.name} Materials</h2>
                  <Badge variant="outline" className="ml-2">
                    {collections.length} {collections.length === 1 ? 'item' : 'items'}
                  </Badge>
                </div>
                
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {collections.map((collection: Collection) => (
                    <Card key={collection.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-2" style={{ backgroundColor: typeInfo.color }}></div>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg font-medium">
                            {formatNumber(collection.wasteAmount || 0)} kg
                          </CardTitle>
                          <Badge className="ml-2" style={{ 
                            backgroundColor: `${typeInfo.color}20`, 
                            color: typeInfo.color,
                            border: `1px solid ${typeInfo.color}40`
                          }}>
                            {typeInfo.name}
                          </Badge>
                        </div>
                        <CardDescription>
                          Collected on {new Date(collection.completedDate || collection.scheduledDate).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">{collection.address}</span>
                        </div>
                        
                        {collection.notes && (
                          <div className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <span>{collection.notes}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <CircleDollarSign className="h-4 w-4" />
                            <span>${formatNumber((collection.wasteAmount || 0) * 0.2, 2)} est. value</span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Leaf className="h-4 w-4" />
                            <span>{formatNumber((collection.wasteAmount || 0) * 2)} kg CO₂ offset</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/collections/${collection.id}`)}
                        >
                          View Details
                        </Button>
                        <Button
                          onClick={() => handleAcquireMaterial(collection.id)}
                          className="flex items-center gap-1"
                        >
                          Express Interest
                          <ArrowRight className="h-4 w-4 ml-1" />
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
    </div>
  );
}